import path from 'path';

const toKebab = (q) => q.replace(/^\//, '').replace(/[^a-z1-9]/g, '-');

export const transformToKebab = (link) => {
  try {
    const { host = '', pathname } = new URL(link);
    return toKebab(host + pathname);
  } catch (e) {
    return toKebab(link);
  }
};

export const getLinkFromFile = (link, type = 'file') => {
  switch (type) {
    case 'file': {
      const ext = path.extname(link) || '.html';
      const withoutExt = link.replace(ext, '');
      return transformToKebab(withoutExt) + ext;
    }
    case 'directory':
      return `${transformToKebab(link)}_files`;
    default:
      return;
  }
};

export const getHtmlFileName = (link) => {
  const urlInKebabCase = transformToKebab(link);
  return `${urlInKebabCase}.html`;
};
