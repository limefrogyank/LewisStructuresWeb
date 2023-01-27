export function getAverageBondLength(centerAtom: Kekule.Atom, connectedAtoms: Kekule.Atom[]){
    let average = connectedAtoms.reduce((p,v)=>{
        let len = Math.sqrt(Math.pow(v.coord2D.x - centerAtom.coord2D.x, 2) + Math.pow(v.coord2D.y - centerAtom.coord2D.y, 2));
        return p +len;
    },0);
    average /= connectedAtoms.length;
    return average;
}

export function getBondAngle(fromAtom: Kekule.Atom, toAtom: Kekule.Atom){
    let angle = Math.atan2(-(toAtom.coord2D.y - fromAtom.coord2D.y),toAtom.coord2D.x - fromAtom.coord2D.x)
    return angle;
}

//classic tetrahedral
const angle1 = -19.5/360*Math.PI*2; 
const vec1x = Math.cos(angle1); 
const vec1y = Math.sin(angle1); 
const angle2 = Math.PI/2;
const vec2x = Math.cos(angle2); 
const vec2y = Math.sin(angle2); 
const angle3 = -150/360* Math.PI*2;
const vec3x = Math.cos(angle3); 
const vec3y = Math.sin(angle3); 
const angle4 = -180/360* Math.PI*2;
const vec4x = Math.cos(angle4); 
const vec4y = Math.sin(angle4);

//trigonal bipyramidal
const tbangle1 = 0; 
const tbvec1x = Math.cos(tbangle1); 
const tbvec1y = Math.sin(tbangle1); 
const tbangle2 =  160/360* Math.PI*2;
const tbvec2x = Math.cos(tbangle2); 
const tbvec2y = Math.sin(tbangle2); 
const tbangle3 =  -160/360* Math.PI*2;
const tbvec3x = Math.cos(tbangle3); 
const tbvec3y = Math.sin(tbangle3); 
const tbangle4 = Math.PI/2;
const tbvec4x = Math.cos(tbangle4); 
const tbvec4y = Math.sin(tbangle4);
const tbangle5 = -Math.PI/2;
const tbvec5x = Math.cos(tbangle5); 
const tbvec5y = Math.sin(tbangle5);

//octahedral
const oangle1 = Math.PI/2; 
const ovec1x = Math.cos(oangle1); 
const ovec1y = Math.sin(oangle1); 
const oangle2 =  30/360* Math.PI*2;
const ovec2x = Math.cos(oangle2); 
const ovec2y = Math.sin(oangle2); 
const oangle3 =  -30/360* Math.PI*2;
const ovec3x = Math.cos(oangle3); 
const ovec3y = Math.sin(oangle3); 
const oangle4 = -Math.PI/2;
const ovec4x = Math.cos(oangle4); 
const ovec4y = Math.sin(oangle4);
const oangle5 = 150/360* Math.PI*2;
const ovec5x = Math.cos(oangle5); 
const ovec5y = Math.sin(oangle5);
const oangle6 = -150/360* Math.PI*2;
const ovec6x = Math.cos(oangle6); 
const ovec6y = Math.sin(oangle6);

function getVectors(angle:number):{x:number,y:number} {
    return {x: Math.cos(angle), y: Math.sin(angle)};
}

export function generateOctahedralVectors(backboneBondAngle: number, useFlat:boolean = false, addPreceding:boolean=false){
    let vectors : {x:number,y:number}[] = [];

    if (addPreceding){
        vectors.push(getVectors(oangle1+backboneBondAngle));
    }
    vectors.push(getVectors(oangle2+backboneBondAngle));
    vectors.push(getVectors(oangle3+backboneBondAngle));
    vectors.push(getVectors(oangle4+backboneBondAngle));
    vectors.push(getVectors(oangle5+backboneBondAngle));
    vectors.push(getVectors(oangle6+backboneBondAngle));
       
    return vectors;
}

export function generateTrigonalBypyramidalVectors(backboneBondAngle: number, useFlat:boolean = false, addPreceding:boolean=false){
    let vectors : {x:number,y:number}[] = [];

    if (addPreceding){
        vectors.push(getVectors(tbangle5+backboneBondAngle));
    }
    vectors.push(getVectors(tbangle4+backboneBondAngle));
    vectors.push(getVectors(tbangle1+backboneBondAngle));
    vectors.push(getVectors(tbangle2+backboneBondAngle));
    vectors.push(getVectors(tbangle3+backboneBondAngle));
       
    return vectors;
}

export function generateTerminalTetrahedralVectors(backboneBondAngle: number, useFlat:boolean = false, addPreceding:boolean=false){
    let vectors : {x:number,y:number}[] = [];
    // 0 to 3pi/8 -> down + up/left
    // 0 to -3pi/8 -> up + down/left
    // 5pi/8 to pi -> down + up/right
    // -5pi/8 to -pi -> up + down/right

    // 3pi/8 to 5pi/8 -> (bond is up already) right + down/left
    //-3pi/8 to -5pi/8 -> (bond is down already) left + down/right
    if (!useFlat){
        if (backboneBondAngle >0 && backboneBondAngle < Math.PI*3/8){
            if (addPreceding){
                vectors.push({x:vec1x, y:-vec1y});
            }
            vectors.push({x:vec2x, y:-vec2y});
            vectors.push({x:vec3x, y:-vec3y});
            vectors.push({x:vec4x, y:-vec4y});
        } else if (backboneBondAngle >=Math.PI*3/8 && backboneBondAngle < Math.PI*5/8){
            vectors.push({x:vec1x, y:vec1y});        
            vectors.push({x:vec3x, y:vec3y});
            vectors.push({x:vec4x, y:vec4y});
        } else if (backboneBondAngle >=Math.PI*5/8 && backboneBondAngle <= Math.PI ){
            vectors.push({x:-vec2x, y:-vec2y});
            vectors.push({x:-vec3x, y:-vec3y});
            vectors.push({x:-vec4x, y:-vec4y});
        } else if (backboneBondAngle <= 0 && backboneBondAngle >= -Math.PI*3/8){
            if (addPreceding){
                vectors.push({x:vec1x, y:vec1y});
            }
            vectors.push({x:vec2x, y:vec2y});
            vectors.push({x:vec3x, y:vec3y});
            vectors.push({x:vec4x, y:vec4y});
        } else if (backboneBondAngle < -Math.PI*3/8 && backboneBondAngle >= -Math.PI*5/8){
            vectors.push({x:vec1x, y:-vec1y});
            vectors.push({x:vec3x, y:-vec3y});
            vectors.push({x:vec4x, y:-vec4y});
        } else if (backboneBondAngle < -Math.PI*5/8 && backboneBondAngle >= -Math.PI){
            vectors.push({x:-vec2x, y:vec2y});
            vectors.push({x:-vec3x, y:vec3y});
            vectors.push({x:-vec4x, y:vec4y});
        }
    } else {
        if (addPreceding){
            vectors.push({x:Math.cos(backboneBondAngle), y:Math.sin(backboneBondAngle)});
        }
        let angle = backboneBondAngle + (Math.PI/2);
        vectors.push({x:Math.cos(angle), y:Math.sin(angle)});
        angle += (Math.PI/2);
        vectors.push({x:Math.cos(angle), y:Math.sin(angle)});
        angle += (Math.PI/2);
        vectors.push({x:Math.cos(angle), y:Math.sin(angle)});
    }
       
    return vectors;
}

export function getBentVectors(backboneBondAngle: number, useFlat:boolean = false, addPreceding:boolean=false){
    let vectors : {x:number,y:number}[] = [];

    let newAngle = backboneBondAngle + Math.PI/3;
    //lone pairs above bent structure
    const angle5 = 70/360* Math.PI*2; 
    const vec5x = Math.cos(angle5); 
    const vec5y = Math.sin(angle5);
    const angle6 = 110/360* Math.PI*2;
    const vec6x = Math.cos(angle6); 
    const vec6y = Math.sin(angle6);

    if (!useFlat){
        if (addPreceding){
            vectors.push({x:1, y:0});
            vectors.push({x:-1, y:0});
            vectors.push({x:0, y:1});
            vectors.push({x:0, y:-1});
        } else {

        }   
        
    } else {
        if (addPreceding){
            vectors.push({x:Math.cos(backboneBondAngle), y:Math.sin(backboneBondAngle)});
        }
        let angle = backboneBondAngle + (Math.PI/2);
        vectors.push({x:Math.cos(angle), y:Math.sin(angle)});
        angle += (Math.PI/2);
        vectors.push({x:Math.cos(angle), y:Math.sin(angle)});
        angle += (Math.PI/2);
        vectors.push({x:Math.cos(angle), y:Math.sin(angle)});
    }
       
    return vectors;
}


export function getTetrahedralVectors(isClassic:boolean=true, bondingPairs:number = 4, useFlat:boolean=false){
    let vectors : {x:number,y:number}[] = [];
    if (isClassic){

        if (bondingPairs >=3){
            vectors.push({x:vec1x, y:vec1y});
            vectors.push({x:vec2x, y:vec2y});
            vectors.push({x:vec3x, y:vec3y});
            vectors.push({x:vec4x, y:vec4y});
        } else if (bondingPairs){
            vectors.push({x:vec1x, y:vec1y}); //bent
            vectors.push({x:-vec1x, y:vec1y}); //bent
            // vectors.push({x:vec5x, y:vec5y}); //lone pair
            // vectors.push({x:vec6x, y:vec6y}); //lone pair
        } else {
            //linear
            vectors.push({x:1, y:0}); //other atom
            vectors.push({x:0, y:1});
            vectors.push({x:-1, y:0});
            vectors.push({x:0, y:-1});
        }
    } else {

        //will not use these... going to rely on openbabel chain construction.
        const angle1 = -160.5/360*Math.PI*2; 
        const vec1x = Math.cos(angle1); 
        const vec1y = Math.sin(angle1); 
        const angle2 = -19.5/360* Math.PI*2;
        const vec2x = Math.cos(angle2); 
        const vec2y = Math.sin(angle2); 
        const angle3 = 75/360* Math.PI*2;
        const vec3x = Math.cos(angle3); 
        const vec3y = Math.sin(angle3); 
        const angle4 = 105/360* Math.PI*2;
        const vec4x = Math.cos(angle4); 
        const vec4y = Math.sin(angle4);
        vectors.push({x:vec1x, y:vec1y});
        vectors.push({x:vec2x, y:vec2y});
        vectors.push({x:vec3x, y:vec3y});
        vectors.push({x:vec4x, y:vec4y});
    }
    return vectors;
}

export function getTrigonalPlanarVectors(startAngle:number = 0){
    let vectors : {x:number,y:number}[] = [];
    const angle1 = startAngle; 
    const vec1x = Math.cos(angle1); 
    const vec1y = Math.sin(angle1); 
    const angle2 = startAngle + Math.PI*2/3;
    const vec2x = Math.cos(angle2); 
    const vec2y = Math.sin(angle2); 
    const angle3 =  startAngle-Math.PI*2/3;
    const vec3x = Math.cos(angle3); 
    const vec3y = Math.sin(angle3); 

    vectors.push({x:vec1x, y:vec1y});
    vectors.push({x:vec2x, y:vec2y});
    vectors.push({x:vec3x, y:vec3y});
    
    return vectors;
}