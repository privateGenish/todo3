global.deprecated = (method_name) => {
  switch (method_name) {
    case "getUserPublicData":
      console.log("[getUserPublicData] has detracted and will not longer be sported. Please use [getUserAvailableScope]");
      break;

    default:
      console.log(
        "you are using a detracted method, please view the documents or try to avoid this method as it's no longer supported"
      );
      break;
  }
};
