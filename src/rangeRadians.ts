export class Range{
	discontinuousRanges:number[]=[];


	constructor(){

	}

	public addRadian(radian:number){
		let lowRad = radian - (Math.PI/4);
		let additionalLowRad=0;
		let additionalHighRad=0;
		if (lowRad < -Math.PI){
			additionalLowRad= Math.PI*2 + lowRad;
			additionalHighRad = Math.PI;
			lowRad = -Math.PI;
		}
		let highRad = radian + (Math.PI/4);
		if (highRad > Math.PI){
			additionalHighRad = highRad - (Math.PI*2);
			additionalLowRad = -Math.PI;
			highRad = Math.PI;
		}
		
		this.addRange(lowRad,highRad);
		
		if (additionalLowRad != 0 && additionalHighRad != 0){
			this.addRange(additionalLowRad, additionalHighRad);
		}
	}

	private addRange(lowRad:number, highRad:number){
		//check if lowRad, then highRad are inbetween any existing discontinousRanges
		let lowRadInside:boolean=false;
		let copy = this.discontinuousRanges.slice();
		for (let i=0; i<this.discontinuousRanges.length;i++){
			if (lowRad<this.discontinuousRanges[i]){
				lowRadInside=true;
				//now check if inside range or starting new range
				if (i % 2 == 0) { //even, so outside of existing range.
					let found:boolean=false;
					for (let j=i+1; j<this.discontinuousRanges.length;j++){
						if (highRad < this.discontinuousRanges[j]){
							found=true;
							if (j % 2 == 0){ //next range has gap
								copy.splice(i, j-i, ...[lowRad,highRad]);
							} else { //next range should merge with new range.
								copy.splice(i, j-i-1, ...[lowRad]);
							}
							break;
						} 
					}
					if (!found){
						//range was bigger than rest of existing ranges
						copy.splice(i,this.discontinuousRanges.length - i, ...[lowRad,highRad]);
					}

				} else { //odd, so inside existing range
					let found:boolean=false;
					for (let j=i+1; j<this.discontinuousRanges.length;j++){
						if (highRad < this.discontinuousRanges[j]){
							found=true;
							if (j % 2 == 0){ //next range has gap
								copy.splice(i, j-i, ...[highRad]);
							} else { //next range should merge with new range.
								copy.splice(i, j-i);
							}
							break;
						} 						
					}
					if (!found){
						//range was bigger than rest of existing ranges
						copy.splice(i,this.discontinuousRanges.length - i, ...[highRad]);
					}
				}
				break;
			}
		}
		if (!lowRadInside){
			copy.push(lowRad,highRad);
		}
		this.discontinuousRanges = copy;
	}

	public getFirstOpenSpace(spread:number=Math.PI/4):number{
		let openRadian = 0;
		let low = -Math.PI;
		let high = -Math.PI;

		for (let i=0; i<this.discontinuousRanges.length;i++){
			if (i % 2 == 0) {
				//start of range
				high = this.discontinuousRanges[i];

				if (high-low >= spread){
					return low + (spread/2);
				}
			}
			else {
				//end of range
				low = this.discontinuousRanges[i];
			}
		}
		high = Math.PI;
		if (high-low >= spread){
			return low+(spread/2);
		}

		return 0;
	}

}