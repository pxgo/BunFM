const packageJSON = require("../../package.json");
class MetadataSettings {
  nickname = packageJSON.nickname;
  description = packageJSON.description;
  version = packageJSON.version;
  homePage = packageJSON.homepage;
  author = `${packageJSON.author.name}(${packageJSON.author.url})`;
}

export const metadataSettings = new MetadataSettings();
