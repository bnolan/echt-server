const promisify = require('es6-promisify');
const childProcess = require('child_process');
const tempfile = require('tempfile');
const im = require('imagemagick');
const fs = require('fs');

exports.toSmall = (buffer) => {
  const original = tempfile('.jpg');
  const small = tempfile('.jpg');
  const crop = promisify(im.crop);

  fs.writeFileSync(original, buffer);

  return crop({
    srcPath: original,
    dstPath: small,
    width: 256,
    height: 256,
    quality: 1
  }).then((stdout, stderr) => {
    return fs.readFileSync(small);
  });
};

exports.toInline = (buffer) => {
  const original = tempfile('.jpg');
  const exec = promisify(childProcess.exec);

  fs.writeFileSync(original, buffer);

  const command = `convert ${original} -resize 16x16 -quality 90 -strip -gravity center -crop 16x16+0+0 +repage - | base64`;

  return exec(command).then((stdout, stderr) => {
    return stdout;
  });
};

/**
 * Crops by percentage-based bounding boxes.
 *
 * @param {Buffer}
 * @param {Object} boundingBox See http://docs.aws.amazon.com/rekognition/latest/dg/API_BoundingBox.html
 * @return {String} Base64 encoded image string
 */
exports.cropByBoundingBox = (buffer, boundingBox) => {
  const exec = promisify(childProcess.exec);
  const original = tempfile('.jpg');

  fs.writeFileSync(original, buffer);

  const identifyCommand = `identify -format %w,%h ${original}`;
  return exec(identifyCommand)
    .then((stdout, stderr) => {
      console.log('identify', stdout);
      return stdout.split(',');
    })
    .then(dimensions => {
      const overSize = 0; // .2;

      const origWidth = dimensions[0];
      const cropWidth = Math.ceil(origWidth * boundingBox.Width) + (origWidth * overSize);

      const origHeight = dimensions[1];
      const cropHeight = Math.ceil(origHeight * boundingBox.Height) + (origHeight * overSize);

      const cropLeft = Math.floor(origWidth * boundingBox.Left) - (origWidth * overSize * 0.5);
      const cropTop = Math.floor(origHeight * boundingBox.Top) - (origHeight * overSize * 0.5);

      const id = 'crop-' + Math.floor(Math.random() * 0xFFFFF) + '.jpg';

      const convertCommand = `convert ${original} -quality 80 -crop ${cropWidth}x${cropHeight}+${cropLeft}+${cropTop} +repage - | tee /tmp/${id} | base64`;
      return exec(convertCommand);
    })
    .then((stdout, stderr) => {
      return stdout;
    });
};
