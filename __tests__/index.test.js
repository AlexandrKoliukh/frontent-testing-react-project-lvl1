import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import { makeLink } from '../src/utils';
import savePage from '../src/index';

/* eslint-disable arrow-body-style */
const getFixturePath = (fileName) => {
  return path.join(__dirname, '..', '__fixtures__', fileName);
};

describe('load-page', () => {
  const hostname = 'hexlet.io';
  const pathname = '/courses';
  const testLink = `https://${path.join(hostname, pathname)}`;

  let pathToTempDir;

  beforeAll(async () => {
    nock.disableNetConnect();
    pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterAll(async () => {
    nock.cleanAll();
  });

  test('pageLoad save html', async () => {
    const responseBodyHtml = await fs.readFile(
      getFixturePath('test.html'),
      'utf-8',
    );
    const responseBodyJs = await fs.readFile(
      getFixturePath('assets/application.js'),
      'utf-8',
    );
    const responseBodyCss = await fs.readFile(
      getFixturePath('css/index.css'),
      'utf-8',
    );
    const responseBodyImg = await fs.readFile(
      getFixturePath('images/img.png'),
      'utf-8',
    );

    const expectDataHtml = await fs.readFile(
      getFixturePath('testWithChangedLinks.html'),
      'utf-8',
    );

    const scope = nock(/localhost|hexlet/)
      .get(pathname)
      .reply(200, responseBodyHtml)
      .get(/application.js/)
      .reply(200, responseBodyJs)
      .get(/index.css/)
      .reply(200, responseBodyCss)
      .get(/img.png/)
      .reply(200, responseBodyImg);

    await savePage(testLink, pathToTempDir);
    const completedPath = path.join(pathToTempDir, makeLink(testLink));
    const loadedData = await fs.readFile(completedPath, 'utf-8');

    const resultDirName = 'hexlet-io-courses_files';

    const completedPathToJs = path.join(
      pathToTempDir,
      resultDirName,
      'hexlet-io-assets-application.js',
    );
    const completedPathToCss = path.join(
      pathToTempDir,
      resultDirName,
      'hexlet-io-css-index.css',
    );
    const completedPathToImg = path.join(
      pathToTempDir,
      resultDirName,
      'hexlet-io-images-img.png',
    );
    const loadedDataJs = await fs.readFile(completedPathToJs, 'utf-8');
    const loadedDataCss = await fs.readFile(completedPathToCss, 'utf-8');
    const loadedDataImg = await fs.readFile(completedPathToImg, 'utf-8');

    scope.done();
    expect(loadedData.trim()).toBe(expectDataHtml.trim());
    expect(loadedDataJs).toBe(responseBodyJs);
    expect(loadedDataCss).toBe(responseBodyCss);
    expect(loadedDataImg).toBe(responseBodyImg);
  });
});

describe('Exceptions', () => {
  test('404', async () => {
    const pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    const scope = await nock(/localhost|hexlet/)
      .get(/wrongpath/)
      .reply(404);

    await expect(
      savePage('https://hexlet.io/wrongpath', pathToTempDir),
    ).rejects.toThrow('Request failed with status code 404');
    scope.done();
  });

  test('wrong directory', async () => {
    const pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    const scope = await nock(/localhost|hexlet/)
      .get(/courses/)
      .reply(200, '');

    await expect(
      savePage(
        'https://hexlet.io/courses',
        `${pathToTempDir}/errorDirectoryName`,
      ),
    ).rejects.toThrow();
    scope.done();
  });
});
