exports.default = async function(configuration) {
  console.log("Custom sign script: Skipping signing for " + configuration.path);
  return;
};
