const sharp = require('sharp');
sharp('build/icon.png').png().toFile('build/icon_fixed.png')
  .then(() => console.log('Fixed'))
  .catch(err => console.error(err));
