import { makeLink } from '../src/utils';

test('getNameFromLink', () => {
  const fileName1 = makeLink('http://example.com/temp/rocks');
  expect(fileName1).toBe('example-com-temp-rocks.html');
  const fileName2 = makeLink('https://ru.hexlet.io/courses', 'directory');
  expect(fileName2).toBe('ru-hexlet-io-courses_files');
  const fileName3 = makeLink('/assets/application.js');
  expect(fileName3).toBe('assets-application.js');
  const fileName4 = makeLink('/assets/application.css');
  expect(fileName4).toBe('assets-application.css');
  const fileName5 = makeLink('images/img2.jpg');
  expect(fileName5).toBe('images-img2.jpg');
});
