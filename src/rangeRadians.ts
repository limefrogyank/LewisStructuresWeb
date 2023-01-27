export class Range{
	discontinuousRanges:number[]=[];
	radians:number[]=[];
	moddedRadians: number[] = [];
	coordinationNumber :number;
	constructor(coordinationNumber: number){
		this.coordinationNumber=coordinationNumber;
	}

	// public addRadian(radian:number){
	// 	let lowRad = radian - (Math.PI/4);
	// 	let additionalLowRad=0;
	// 	let additionalHighRad=0;
	// 	if (lowRad < -Math.PI){
	// 		additionalLowRad= Math.PI*2 + lowRad;
	// 		additionalHighRad = Math.PI;
	// 		lowRad = -Math.PI;
	// 	}
	// 	let highRad = radian + (Math.PI/4);
	// 	if (highRad > Math.PI){
	// 		additionalHighRad = highRad - (Math.PI*2);
	// 		additionalLowRad = -Math.PI;
	// 		highRad = Math.PI;
	// 	}
		
	// 	this.addRange(lowRad,highRad);
		
	// 	if (additionalLowRad != 0 && additionalHighRad != 0){
	// 		this.addRange(additionalLowRad, additionalHighRad);
	// 	}
	// }

	public addRadian(radian:number){
		this.radians.push(radian);
		if (radian < 0){
			this.moddedRadians.push(radian + (Math.PI*2));
		} else {
			this.moddedRadians.push(radian);
		}
	}

	// private addRange(lowRad:number, highRad:number){
	// 	//check if lowRad, then highRad are inbetween any existing discontinousRanges
	// 	let lowRadInside:boolean=false;
	// 	let copy = this.discontinuousRanges.slice();
	// 	for (let i=0; i<this.discontinuousRanges.length;i++){
	// 		if (lowRad<this.discontinuousRanges[i]){
	// 			lowRadInside=true;
	// 			//now check if inside range or starting new range
	// 			if (i % 2 == 0) { //even, so outside of existing range.
	// 				let found:boolean=false;
	// 				for (let j=i+1; j<this.discontinuousRanges.length;j++){
	// 					if (highRad < this.discontinuousRanges[j]){
	// 						found=true;
	// 						if (j % 2 == 0){ //next range has gap
	// 							copy.splice(i, j-i, ...[lowRad,highRad]);
	// 						} else { //next range should merge with new range.
	// 							copy.splice(i, j-i-1, ...[lowRad]);
	// 						}
	// 						break;
	// 					} 
	// 				}
	// 				if (!found){
	// 					//range was bigger than rest of existing ranges
	// 					copy.splice(i,this.discontinuousRanges.length - i, ...[lowRad,highRad]);
	// 				}

	// 			} else { //odd, so inside existing range
	// 				let found:boolean=false;
	// 				for (let j=i+1; j<this.discontinuousRanges.length;j++){
	// 					if (highRad < this.discontinuousRanges[j]){
	// 						found=true;
	// 						if (j % 2 == 0){ //next range has gap
	// 							copy.splice(i, j-i, ...[highRad]);
	// 						} else { //next range should merge with new range.
	// 							copy.splice(i, j-i);
	// 						}
	// 						break;
	// 					} 						
	// 				}
	// 				if (!found){
	// 					//range was bigger than rest of existing ranges
	// 					copy.splice(i,this.discontinuousRanges.length - i, ...[highRad]);
	// 				}
	// 			}
	// 			break;
	// 		}
	// 	}
	// 	if (!lowRadInside){
	// 		copy.push(lowRad,highRad);
	// 	}
	// 	this.discontinuousRanges = copy;
	// }

	public getFirstOpenSpace():number{
		//console.log("SORTED");
		const sorted = this.moddedRadians.sort();
		//console.log(sorted);
		const gaps:number[] = [];
		for (let i =0; i<this.moddedRadians.length; i++){
			if (i < this.moddedRadians.length - 1){
				gaps.push(this.moddedRadians[i+1] - this.moddedRadians[i]);
			} else {
				let last = this.moddedRadians[i] - (2*Math.PI);
				gaps.push(this.moddedRadians[0] - last);
			}
		}
		//console.log("GAPS");
		//console.log(gaps);
		let max = -Infinity;
		var indexOfMaxValue = gaps.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		//console.log(indexOfMaxValue);
		let betweenA = sorted[indexOfMaxValue];
		let betweenB = indexOfMaxValue == sorted.length - 1 ? sorted[0]+(Math.PI*2) : sorted[indexOfMaxValue + 1];
		//console.log("Calculating best angle");
		if (this.coordinationNumber == 0){
			if (betweenB-betweenA >= Math.PI){
				return betweenA + Math.PI/2; //just add 90 degrees to the edge of such a big gap.
			} else {
				let middle = (betweenB + betweenA )/2;
				return middle;
			}
		} else {
			switch (this.coordinationNumber){
				case 2: 
					return betweenA + Math.PI;
				case 3:
					return betweenA + (Math.PI*2/3);
				case 4:				
					//special cases!
					if (betweenB-betweenA >= Math.PI){
						return betweenA + Math.PI/2; //just add 90 degrees to the edge of such a big gap.
					} else {
						let middle = (betweenB + betweenA )/2;
						return middle;
					}
				case 5: 
					//special cases!
					// console.log("Calculating best angle");
					// console.log(sorted);
					// console.log(gaps);
					// console.log(indexOfMaxValue);
					if (betweenB-betweenA >= Math.PI && sorted.length <3){
						return betweenA + Math.PI/2; //just add 90 degrees to the edge of such a big gap.
					} else if (sorted.length == 3) {
						return betweenA + (Math.PI/3);
					} else if (sorted.length == 4){
						return betweenB - (Math.PI/3);
					} else {
						let middle = (betweenB + betweenA )/2;
						return middle;
					}
				case 6:
					return betweenA + (Math.PI*2/6);
				default:
					if (betweenB-betweenA >= Math.PI){
						return betweenA + Math.PI/2; //just add 90 degrees to the edge of such a big gap.
					} else {
						let middle = (betweenB + betweenA )/2;
						return middle;
					}
			}
		}
		
	}

	// public getFirstOpenSpace(spread:number=Math.PI/4):number{
	// 	let openRadian = 0;
	// 	let low = -Math.PI;
	// 	let high = -Math.PI;

	// 	for (let i=0; i<this.discontinuousRanges.length;i++){
	// 		if (i % 2 == 0) {
	// 			//start of range
	// 			high = this.discontinuousRanges[i];

	// 			if (high-low >= spread){
	// 				return low + (spread/2);
	// 			}
	// 		}
	// 		else {
	// 			//end of range
	// 			low = this.discontinuousRanges[i];
	// 		}
	// 	}
	// 	high = Math.PI;
	// 	if (high-low >= spread){
	// 		return low+(spread/2);
	// 	}

	// 	return 0;
	// }

}