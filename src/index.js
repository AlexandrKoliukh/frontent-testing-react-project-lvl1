import axios from 'axios';
import path from 'path';
import { createWriteStream, promises as fs } from 'fs';
import cheerio from 'cheerio';
import debug from 'debug';
import { keys } from 'lodash';
import { getHtmlFileName, getNameFromLink, isAbsoluteLink } from './utils';
import extractSourceLinks from './parser';

const log = debug('page-loader');

const tagsMapping = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const changePageLinksToRelative = (page, dir) => {
  const $ = cheerio.load(page);
  keys(tagsMapping).forEach((tag) => {
    $(tag).each((index, element) => {
      const link = $(element).attr(tagsMapping[tag]);
      if (!link || isAbsoluteLink(link)) return;

      $(element).attr(tagsMapping[tag], path.join(dir, getNameFromLink(link)));
    });
  });
  return $.html();
};

const loadResource = (loadedUrl, link, outputPath) => {
  const resultFilePath = path.join(outputPath, getNameFromLink(link));
  return axios({
    method: 'get',
    url: loadedUrl,
    responseType: 'stream',
  })
    .then(({ data }) => {
      log(`Fetch resource ${loadedUrl} to ${resultFilePath}`);
      data.pipe(createWriteStream(resultFilePath));
    })
    .catch((error) => {
      log(`Fetch resource ${loadedUrl} failed ${error.message}`);
      throw error;
    });
};

export const saveResources = (loadedUrl, outputPath, page) => {
  const relativeLinks = extractSourceLinks(page);
  console.log('Relative links: ', relativeLinks);
  const resultDirName = getNameFromLink(loadedUrl, 'directory');
  const resultOutput = path.join(outputPath, resultDirName);
  return fs
    .mkdir(resultOutput)
    .then(() => {
      log(`Create folder ${resultOutput} for resources`);
      return relativeLinks.map((link) => {
        console.log('loadedUrl', loadedUrl);
        const { protocol, host } = new URL(loadedUrl);
        const resourceUrl = protocol + host + link;
        console.log('resourceUrl', resourceUrl);
        return loadResource(resourceUrl, link, resultOutput);
      });
    })
    .then((tasks) => Promise.all(tasks))
    .catch((error) => {
      log(`Create folder ${resultOutput} failed ${error.message}`);
      throw error;
    });
};

const savePage = (loadedUrl, outputPath) => {
  const sourceDir = getNameFromLink(loadedUrl, 'directory');

  return axios.get(loadedUrl).then((res) => {
    log(`Load page ${loadedUrl} to ${outputPath}`);
    const resultFilePath = path.join(outputPath, getHtmlFileName(loadedUrl));
    const page = res.data;
    const newPage = changePageLinksToRelative(page, sourceDir);

    return fs
      .writeFile(resultFilePath, newPage)
      .then(() => saveResources(loadedUrl, outputPath, res.data))
      .catch((error) => {
        log(`Writing to ${resultFilePath} error, ${error.message}`);
        throw error;
      });
  });
};

export default savePage;
