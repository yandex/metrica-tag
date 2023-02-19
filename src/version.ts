// Внимание этот файл также исполняется при сборке в node.js
// для получения номера версии исходя из флагов сборки

const getVersion: () => string = () => process.env.VERSION! || '25';

export { getVersion };
