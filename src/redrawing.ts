import { generateOctahedralVectors, generateTerminalTetrahedralVectors, generateTrigonalBypyramidalVectors, getAverageBondLength, getBondAngle, getTetrahedralVectors, getTrigonalPlanarVectors } from "./angles";

function shiftAndScale(atom:Kekule.Atom, vector:{x:number,y:number}, length:number): {x:number, y:number}{
    return {x: atom.coord2D.x + vector.x * length, y:-vector.y* length + atom.coord2D.y};
}

function adjustBondAngles(molecule:Kekule.Molecule, centerAtoms: Kekule.Atom[] , options:{useFlat:boolean, showFormalCharges:boolean} = {useFlat:true, showFormalCharges:true}){
    		
    const useFlat=options.useFlat;
    const showFormalCharges = options.showFormalCharges;

     //check all "central" atoms for bond adjustments i.e. tetrahedral, trigonal pyramid, trigonal bipyramid, etc.
    //anything with lone pairs is really screwed up because it gets drawn as if there are none.
    for (let i=0; i<centerAtoms.length; i++){
        let centerAtom = centerAtoms[i];
        let linked = <Kekule.Atom[]>centerAtom.getLinkedChemNodes(false).sort((a,b)=> a.getLinkedChemNodes().length - b.getLinkedChemNodes().length);
        let markerCount = centerAtom.getMarkerCount();
        let bonds = centerAtom.getLinkedBonds();
        let linkedCentralAtoms = linked.filter(x=> centerAtoms.includes(x));
        let terminalAtoms = linked.filter(x=> !centerAtoms.includes(x));
        //console.log('getMarkersOfType error?');
        let lonepairs = centerAtoms[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet,false);
        let length = getAverageBondLength(centerAtom,linked);
        
        //tetrahedral
        if (linked.length == 4 && markerCount == 0) {            
            if (centerAtoms.length == 1) {
                
                //redraw them all.
                //let vectors = getTetrahedralVectors(true);
                let vectors = generateTerminalTetrahedralVectors(0,useFlat,true);
                linked[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
                linked[1].coord2D = {x: centerAtom.coord2D.x + vectors[1].x * length, y:-vectors[1].y* length + centerAtom.coord2D.y};
                linked[2].coord2D = {x: centerAtom.coord2D.x + vectors[2].x * length, y:-vectors[2].y* length + centerAtom.coord2D.y};
                linked[3].coord2D = {x: centerAtom.coord2D.x + vectors[3].x * length, y:-vectors[3].y* length + centerAtom.coord2D.y};
                if (!useFlat){
                    let otherBonds = linked[2].getLinkedBonds();
                    let intersection = bonds.filter(x=> otherBonds.includes(x));
                    if (intersection.length == 1){
                        intersection[0].stereo =Kekule.BondStereo.UP;
                    }
                    otherBonds = linked[3].getLinkedBonds();
                    intersection = bonds.filter(x=> otherBonds.includes(x));
                    if (intersection.length == 1){
                        intersection[0].stereo =Kekule.BondStereo.DOWN;
                    }
                }
            } else {
                //find ends of chain, measure angle to other backbone atom, and draw bonds to terminal atoms based on it
                //any middle chain atoms just do terminal atoms (other hydrogens or halogens)
                if (linkedCentralAtoms.length == 1){
                    //end of chain
                    let angle = getBondAngle(centerAtom,linkedCentralAtoms[0]);
                    let vectors = generateTerminalTetrahedralVectors(angle, useFlat);
                    terminalAtoms[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
                    terminalAtoms[1].coord2D = {x: centerAtom.coord2D.x + vectors[1].x * length, y:-vectors[1].y* length + centerAtom.coord2D.y};
                    terminalAtoms[2].coord2D = {x: centerAtom.coord2D.x + vectors[2].x * length, y:-vectors[2].y* length + centerAtom.coord2D.y};
                    if (!useFlat){
                        let otherBonds = terminalAtoms[1].getLinkedBonds();
                        let intersection = bonds.filter(x=> otherBonds.includes(x));
                        if (intersection.length == 1){
                            intersection[0].stereo =Kekule.BondStereo.UP;
                        }
                        otherBonds = terminalAtoms[2].getLinkedBonds();
                        intersection = bonds.filter(x=> otherBonds.includes(x));
                        if (intersection.length == 1){
                            intersection[0].stereo =Kekule.BondStereo.DOWN;
                        }
                    }
                } else {
                    //middle of chain, use hash/wedge only... assuming 2 terminal atoms.  If fewer, may need logic to find main chain (use 120 angle) 
                    //and replace other bonds with dash/wedge
                    if (!useFlat){
                        for (let j=0; j< terminalAtoms.length; j++){
                            let otherBonds = terminalAtoms[j].getLinkedBonds();
                            let intersection = bonds.filter(x=> otherBonds.includes(x));
                            if (intersection.length == 1){
                                if (j==0){
                                    intersection[0].stereo =Kekule.BondStereo.UP;
                                } else {
                                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                                }
                            }
                        }
                    }
                }


            }
        }else if (linked.length == 3 && markerCount == 1){
            //trigonal pyramid
            if (centerAtoms.length == 1) {
                let vectors = generateTerminalTetrahedralVectors(0,useFlat, true);
                linked[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
                linked[1].coord2D = {x: centerAtom.coord2D.x + vectors[2].x * length, y:-vectors[2].y* length + centerAtom.coord2D.y};
                linked[2].coord2D = {x: centerAtom.coord2D.x + vectors[3].x * length, y:-vectors[3].y* length + centerAtom.coord2D.y};
                lonepairs[0].coord2D = {x: vectors[1].x, y:-vectors[1].y};  //put lone pair on top so it's not one of the wedge bonds.

                if (!useFlat){
                    let otherBonds = linked[1].getLinkedBonds();
                    let intersection = bonds.filter(x=> otherBonds.includes(x));
                    if (intersection.length == 1){
                        intersection[0].stereo =Kekule.BondStereo.UP;
                    }
                    otherBonds = linked[2].getLinkedBonds();
                    intersection = bonds.filter(x=> otherBonds.includes(x));
                    if (intersection.length == 1){
                        intersection[0].stereo =Kekule.BondStereo.DOWN;
                    }
                }
                
            } else {
                if (linkedCentralAtoms.length == 1){
                    let angle = getBondAngle(centerAtom,linkedCentralAtoms[0]);
                    let vectors = generateTerminalTetrahedralVectors(angle,useFlat, false);
                    terminalAtoms[0].coord2D = {x: centerAtom.coord2D.x + vectors[1].x * length, y:-vectors[1].y* length + centerAtom.coord2D.y};
                    terminalAtoms[1].coord2D = {x: centerAtom.coord2D.x + vectors[2].x * length, y:-vectors[2].y* length + centerAtom.coord2D.y};
                   
                    lonepairs[0].coord2D = {x: vectors[0].x, y:-vectors[0].y};  //put lone pair on top so it's not one of the wedge bonds.
                    if (!useFlat){
                        let otherBonds = linked[0].getLinkedBonds();
                        let intersection = bonds.filter(x=> otherBonds.includes(x));
                        if (intersection.length == 1){
                            intersection[0].stereo =Kekule.BondStereo.UP;
                        }
                        otherBonds = linked[1].getLinkedBonds();
                        intersection = bonds.filter(x=> otherBonds.includes(x));
                        if (intersection.length == 1){
                            intersection[0].stereo =Kekule.BondStereo.DOWN;
                        }
                    }
                } else {
                    if (!useFlat) {
                        for (let j=0; j< terminalAtoms.length; j++){
                            let otherBonds = terminalAtoms[j].getLinkedBonds();
                            let intersection = bonds.filter(x=> otherBonds.includes(x));
                            if (intersection.length == 1){
                                if (j==0){
                                    intersection[0].stereo =Kekule.BondStereo.UP;
                                } else {
                                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                                }
                            }
                        }
                    }
                }
            }
           
        }else if (linked.length == 2 && markerCount == 2) {
            //bent
            if (centerAtoms.length == 1){
                let vectors = generateTerminalTetrahedralVectors(0, useFlat, true);
                linked[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
                linked[1].coord2D = {x: centerAtom.coord2D.x + vectors[1].x * length, y:-vectors[1].y* length + centerAtom.coord2D.y};
            } else {
                if (linkedCentralAtoms.length == 1){
                    //terminal
                    let angle = getBondAngle(centerAtom,linkedCentralAtoms[0]);
                    let vectors = generateTerminalTetrahedralVectors(angle,useFlat, false);
                    terminalAtoms[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
                   lonepairs[0].coord2D = {x: vectors[1].x, y:-vectors[1].y};  
                   lonepairs[1].coord2D = {x: vectors[2].x, y:-vectors[2].y};  
                } else {
                    // not terminal, do nothing as we don't use dash/wedge for bent
                }

            }
        } else if (linked.length == 1 && markerCount == 3){
            //linear
            let vectors = generateTerminalTetrahedralVectors(0, useFlat, true);
            linked[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
            let lonepairs = centerAtoms[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet,false);
            lonepairs[0].coord2D = {x: vectors[1].x, y:-vectors[1].y};
            lonepairs[1].coord2D = {x: vectors[2].x, y:-vectors[2].y};
            lonepairs[2].coord2D = {x: vectors[3].x, y:-vectors[3].y};
            
        } else if (linked.length == 3 && markerCount == 0){
            //trigonal planar
            // do nothing
            // let vectors = getTrigonalPlanarVectors();
            // for (let j=0; j<linked.length; j++){
            //     linked[j].coord2D = {x: vectors[j].x, y:-vectors[j].y};
            // }
            // let lonePairs = centerAtoms[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet,false);
            // for (let j=0; j<lonePairs.length; j++){
            //     lonePairs[j].coord2D = {x: vectors[linked.length + j].x, y:-vectors[linked.length + j].y};
            // }

        } else if (linked.length == 2 && markerCount == 1){
            // bent from trigonal planar.  as a shortcut, use tetrahedral angles
            if (centerAtoms.length == 1){
                let vectors = generateTerminalTetrahedralVectors(0, useFlat, true);
            } else {
                if (linkedCentralAtoms.length == 1){
                    //terminal
                    let angle = getBondAngle(centerAtom,linkedCentralAtoms[0]);
                    let vectors = generateTerminalTetrahedralVectors(angle,useFlat, false);
                    terminalAtoms[0].coord2D = {x: centerAtom.coord2D.x + vectors[0].x * length, y:-vectors[0].y* length + centerAtom.coord2D.y};
                    lonepairs[0].coord2D = {x: vectors[1].x, y:-vectors[1].y};  
                   
                } else {
                    
                }
            }
        }  else if (linked.length == 5 && markerCount == 0){ 
            // trigonal bipyramidal
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateTrigonalBypyramidalVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                linked[2].coord2D = shiftAndScale(centerAtom, vectors[2], length);
                linked[3].coord2D = shiftAndScale(centerAtom, vectors[3], length);
                linked[4].coord2D = shiftAndScale(centerAtom, vectors[4], length);

                let otherBonds = linked[3].getLinkedBonds();
                let intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
                otherBonds = linked[4].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
            }

        } else if (linked.length == 4 && markerCount == 1){
            // see-saw
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateTrigonalBypyramidalVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                linked[2].coord2D = shiftAndScale(centerAtom, vectors[3], length);
                linked[3].coord2D = shiftAndScale(centerAtom, vectors[4], length);

                lonepairs[0].coord2D = shiftAndScale(centerAtom, vectors[2], length);

                let otherBonds = linked[2].getLinkedBonds();
                let intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
                otherBonds = linked[3].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
            }
        } else if (linked.length == 3 && markerCount == 2){
            // T-shape
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateTrigonalBypyramidalVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                linked[2].coord2D = shiftAndScale(centerAtom, vectors[2], length);
                
                lonepairs[0].coord2D = shiftAndScale(centerAtom, vectors[3], length);
                lonepairs[1].coord2D = shiftAndScale(centerAtom, vectors[4], length);

                
            }
        } else if (linked.length == 2 && markerCount == 3){
            // linear
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateTrigonalBypyramidalVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                
                lonepairs[2].coord2D = shiftAndScale(centerAtom, vectors[2], length);
                lonepairs[0].coord2D = shiftAndScale(centerAtom, vectors[3], length);
                lonepairs[1].coord2D = shiftAndScale(centerAtom, vectors[4], length);
            }
        } else if (linked.length == 6 && markerCount == 0){ 
            // octahedral
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateOctahedralVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                linked[2].coord2D = shiftAndScale(centerAtom, vectors[2], length);
                linked[3].coord2D = shiftAndScale(centerAtom, vectors[3], length);
                linked[4].coord2D = shiftAndScale(centerAtom, vectors[4], length);
                linked[5].coord2D = shiftAndScale(centerAtom, vectors[5], length);

                let otherBonds = linked[1].getLinkedBonds();
                let intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
                otherBonds = linked[2].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
                otherBonds = linked[4].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
                otherBonds = linked[5].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
            }
        } else if (linked.length == 5 && markerCount == 1){ 
            // square pyramidal
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateOctahedralVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                linked[2].coord2D = shiftAndScale(centerAtom, vectors[2], length);                
                linked[3].coord2D = shiftAndScale(centerAtom, vectors[4], length);
                linked[4].coord2D = shiftAndScale(centerAtom, vectors[5], length);

                lonepairs[0].coord2D = shiftAndScale(centerAtom, vectors[3], length);

                let otherBonds = linked[1].getLinkedBonds();
                let intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
                otherBonds = linked[2].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
                otherBonds = linked[3].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
                otherBonds = linked[4].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
            }
        } else if (linked.length == 4 && markerCount == 2){ 
            // square planar
            if (useFlat){
                // do nothing
            } else {
                let vectors = generateOctahedralVectors(0, useFlat, true);
                linked[0].coord2D = shiftAndScale(centerAtom, vectors[1], length);
                linked[1].coord2D = shiftAndScale(centerAtom, vectors[2], length);
                linked[2].coord2D = shiftAndScale(centerAtom, vectors[4], length);                
                linked[3].coord2D = shiftAndScale(centerAtom, vectors[5], length);
                
                lonepairs[0].coord2D = shiftAndScale(centerAtom, vectors[0], length);
                lonepairs[0].coord2D = shiftAndScale(centerAtom, vectors[3], length);

                let otherBonds = linked[0].getLinkedBonds();
                let intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
                otherBonds = linked[1].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
                otherBonds = linked[2].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.DOWN;
                }
                otherBonds = linked[3].getLinkedBonds();
                intersection = bonds.filter(x=> otherBonds.includes(x));
                if (intersection.length == 1){
                    intersection[0].stereo =Kekule.BondStereo.UP;
                }
            }
        }
        
    }
}

export function transformLonePairsAndRedraw(molecule:Kekule.Molecule, options:{useFlat:boolean, showFormalCharges:boolean} = {useFlat:true, showFormalCharges:true}){
    const useFlat=options.useFlat;
    const showFormalCharges = options.showFormalCharges;
    const centerAtoms: Kekule.Atom[] = [];
    const fakeAtomsToRemove:Kekule.Atom[] = [];
    const fakeBondsToRemove:Kekule.ChemStructureConnector[] = [];
    for (let i=0; i<molecule.getNodeCount(); i++){
        let atom = <Kekule.Atom>molecule.getNodeAt(i);

        // this is the lone pair hack
        if (atom.symbol == "A"){
            const linkedSibling = atom.linkedSiblings[0];
            const connector = atom.getLinkedConnectorAt(0);
            let lonepair = new Kekule.ChemMarker.UnbondedElectronSet();
            linkedSibling.appendMarker(lonepair);
            fakeAtomsToRemove.push(atom);
            fakeBondsToRemove.push(connector);
        }        
    }
    
    fakeAtomsToRemove.forEach(x=> molecule.removeNode(x));
    fakeBondsToRemove.forEach(x=> molecule.removeConnector(x));

    for (let i=0; i<molecule.getNodeCount(); i++){
        let atom = <Kekule.Atom>molecule.getNodeAt(i);

        if (atom.linkedSiblings.length > 1){
            centerAtoms.push(atom);
        }
    }
    
    adjustBondAngles(molecule, centerAtoms, options);

}

export function addLonePairsAndRedraw(molecule:Kekule.Molecule, options:{useFlat:boolean, showFormalCharges:boolean} = {useFlat:true, showFormalCharges:true}){
		
    const useFlat=options.useFlat;
    const showFormalCharges = options.showFormalCharges;
    const centerAtoms: Kekule.Atom[] = [];
    //let centerAtomConnections = 0;
    //find "center" atoms and add lone pairs to all atoms as needed
    for (let i=0; i<molecule.getNodeCount(); i++){
        let atom = <Kekule.Atom>molecule.getNodeAt(i);
        let linked = atom.getLinkedChemNodes(false);
        if (linked.length > 1){
            //centerAtomConnections = linked.length;
            //centerAtoms = [];
            centerAtoms.push(atom);
        // } else if (linked.length == centerAtomConnections){
        //     centerAtoms.push(atom);
        }

        //add lone pairs where needed
        let bonds = atom.getLinkedBonds();
        let totalPairs = bonds.reduce((p,c)=> {
            return p + c.bondOrder;
        }, 0);
        let element = new Kekule.Element(atom.symbol);
        let valenceElectrons = 0;
        switch (element.group){
            case 1:
                valenceElectrons =1;
                break;
            case 2:
                valenceElectrons =2;
                break;
            case 13:
                valenceElectrons =3;
                break;
            case 14:
                valenceElectrons =4;
                break;
            case 15:
                valenceElectrons =5;
                break;
            case 16:
                valenceElectrons =6;
                break;
            case 17:
                valenceElectrons =7;
                break;
            case 18:
                valenceElectrons =8;
                break;
            default:
                valenceElectrons = 0;
                break;
        }
        let lonePairsToAdd = (valenceElectrons - atom.charge - totalPairs ) / 2;
        //console.log(`Adding ${lonePairsToAdd} lone pairs.`);
        for (let j=0; j<lonePairsToAdd;j++){
            let lonepair = new Kekule.ChemMarker.UnbondedElectronSet();
            atom.appendMarker(lonepair);
        }
        //add formal charge where needed
        if (showFormalCharges && atom.charge != 0){
            let formalCharge = new Kekule.ChemMarker.Charge();
            formalCharge.value = atom.charge;
            atom.appendMarker(formalCharge);
        }
    }

    adjustBondAngles(molecule, centerAtoms, options);
   
}