import path from 'path';

const toKebab = (q) => q.replace(/^\//, '').replace(/[^a-z1-9]/g, '-');

export const transformToKebab = (link) => {
  try {
    const { host = '', pathname } = new URL(link);
    return toKebab(host + pathname);
  } catch {
    return toKebab(link);
  }
};

export const getLinkFromFile = (link, type = 'file') => {
  const urlInKebabCase = transformToKebab(link);

  switch (type) {
    case 'file': {
      const ext = path.extname(link) || '.html';
      return `${urlInKebabCase}${ext}`;
    }
    case 'directory':
      return `${urlInKebabCase}_files`;
    default:
      return 'none';
  }
};

export const getHtmlFileName = (link) => {
  const urlInKebabCase = transformToKebab(link);
  return `${urlInKebabCase}.html`;
};
