import { autoDetectRenderer, Container, Ticker } from 'pixi.js'
import { Viewport } from 'pixi-viewport';

export class PixiNet {
	constructor(el){
		this.el = el;
	}

	async init(){
		this.renderer = await autoDetectRenderer({
			preference: 'webgpu', // or 'webgl'
			width: 800, height: 600, backgroundColor: 0x1099bb 
		});
		console.log(this.renderer)
		this.el.appendChild(this.renderer.view.canvas);	
		this.stage = new Container();
		this.ticker = new Ticker();	
		// this.viewport = new Viewport({
		// 	screenWidth: 800,
		// 	screenHeight: 600,
		// 	worldWidth: 1000,
		// 	worldHeight: 1000,
		// 	// interaction: this.renderer.plugins.interaction // required
		// });

		// this.stage.addChild(this.viewport);

		this.ticker.add(() => this.renderer.render(this.stage));
		this.ticker.start();
	}
}