import axios from 'axios';
import path from 'path';
import { createWriteStream, promises as fs } from 'fs';
import cheerio from 'cheerio';
import debug from 'debug';
import { keys } from 'lodash';
import { getHtmlFileName, getLinkFromFile } from './utils';

const savePage = (baseUrl, outputPath, log = debug('page-loader')) => {
  const { host, origin } = new URL(baseUrl);

  const tagsMapping = {
    link: 'href',
    img: 'src',
    script: 'src',
  };

  const changePageLinksToRelative = (page, dir) => {
    const links = [];

    const $ = cheerio.load(page);
    keys(tagsMapping).forEach((tag) => {
      $(tag).each((index, element) => {
        const uri = $(element).attr(tagsMapping[tag]);

        const link = new URL(uri, origin);
        if (link.host !== host) return;

        links.push(link);
        $(element).attr(
          tagsMapping[tag],
          path.join(dir, getLinkFromFile(link.toString())),
        );
      });
    });
    return { html: $.html(), links };
  };

  const loadResource = (loadedUrl, resourceOutputPath) => {
    const resultFilePath = path.join(
      resourceOutputPath,
      getLinkFromFile(loadedUrl),
    );
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

  const saveResources = (loadedUrl, resourceOutputPath, links) => {
    const resultDirName = getLinkFromFile(loadedUrl, 'directory');
    const resultOutput = path.join(resourceOutputPath, resultDirName);
    return fs
      .mkdir(resultOutput)
      .then(() => {
        log(`Create folder ${resultOutput} for resources`);
        return links.map((link) => {
          const resourceUrl = new URL(link, loadedUrl);
          return loadResource(resourceUrl.toString(), resultOutput);
        });
      })
      .then((tasks) => Promise.all(tasks))
      .catch((error) => {
        log(`Create folder ${resultOutput} failed ${error.message}`);
        throw error;
      });
  };

  return axios.get(baseUrl).then((res) => {
    log(`Load page ${baseUrl} to ${outputPath}`);
    const resultFilePath = path.join(outputPath, getHtmlFileName(baseUrl));
    const page = res.data;
    const sourceDir = getLinkFromFile(baseUrl, 'directory');
    const { html: newPage, links } = changePageLinksToRelative(page, sourceDir);

    return fs
      .writeFile(resultFilePath, newPage)
      .then(() => saveResources(baseUrl, outputPath, links))
      .catch((error) => {
        log(`Writing to ${resultFilePath} error, ${error.message}`);
        throw error;
      });
  });
};

export default savePage;
