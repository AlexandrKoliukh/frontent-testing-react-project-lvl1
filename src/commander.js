import { program } from 'commander';
import savePage from './index';
import { version } from '../package.json';

export default () => {
  program
    .version(version)
    .description('Load web page')
    .arguments('<pageUrl>')
    .option('-o, --output [path]', 'Output folder', process.cwd())
    .action((url, argv) => {
      const { output } = argv;
      savePage(url, output)
        .then(() => console.log(`Page loaded to ${output}`))
        .catch((error) => {
          console.error(error.message);
          process.exit(1);
        });
    })
    .parse(process.argv);
};
