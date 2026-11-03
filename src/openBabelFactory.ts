import * as factoryModule from './kekule/dist/extra/openbabel.js';
import type { OpenBabelModule } from './lewisStructureCanvas';

type OpenBabelFactory = (options: {
	locateFile: (fileName: string) => string;
}) => OpenBabelModule;

const openBabelFactory = factoryModule.default as OpenBabelFactory;
const currentScript = document.currentScript;
const scriptUrl = currentScript instanceof HTMLScriptElement && currentScript.src
	? currentScript.src
	: document.baseURI;
const assetBaseUrl = new URL('.', scriptUrl);

window.OpenBabelModule = () => openBabelFactory({
	locateFile: fileName => new URL(fileName, assetBaseUrl).href
});