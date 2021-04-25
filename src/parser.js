import { keys } from 'lodash';
import cheerio from 'cheerio';
import { isAbsoluteLink } from './utils';

const tagsMapping = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const parse = (page) => {
  const links = [];
  const $ = cheerio.load(page);
  keys(tagsMapping).forEach((el) => {
    $(el).each((i, e) => {
      const link = $(e).attr(tagsMapping[el]);
      if (link && !isAbsoluteLink(link)) {
        links.push(link);
      }
    });
  });

  return links;
};

export default parse;
