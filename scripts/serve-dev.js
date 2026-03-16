const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const port = 5000;

execSync(`npx serve "${projectRoot}" -l ${port}`, {
  stdio: 'inherit',
  shell: true,
});
