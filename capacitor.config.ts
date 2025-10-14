import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.desbin.app',
	appName: 'Desbin',
	webDir: 'www',
	bundledWebRuntime: false,
	server: {
		androidScheme: 'https'
	}
};

export default config;

