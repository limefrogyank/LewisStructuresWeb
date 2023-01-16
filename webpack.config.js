//const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');

module.exports = function(env, { mode }) {
  const production = mode === 'production';
  return {
    mode: production ? 'production' : 'development',
	target: "web",
    devtool: production ? 'source-map' : 'inline-source-map',
    entry: {
      app: ['./src/main.ts']
    },
	ignoreWarnings:[
		
			(warning)=>true
			
	],
	optimization:{
		chunkIds: 'named',
		minimizer: [
			new TerserPlugin({
			  parallel: true,
			  terserOptions: {
				mangle: {
					reserved: ['$super', '$origin'] 
				  },
				// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
			  },
			}),
		  ],
	},
    output: {
      filename: 'bundle.js',
      publicPath:'/'
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['src', 'node_modules']
    },
    devServer: {
      port: 9000,
      historyApiFallback: true,
      open: !process.env.CI,
      devMiddleware: {
        writeToDisk: true,
      },
      static: {
        directory: path.join(__dirname, './')
      }
    },
    plugins: [
      //new CleanWebpackPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.ts$/i,
          use: [
            {
              loader: 'ts-loader'
            }
          ],
          exclude: /node_modules/
        },
		{
			test: /\.css$/i,
			use: ['style-loader', 'css-loader'],
		}
      ]
    }
  }
}