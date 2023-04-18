const valenceMap : Map<number,number> = new Map<number,number>([
[1,1],[2,2],
[3,1],[4,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],
[11,1],[12,2],  [13,3],[14,4],[15,5],[16,6],[17,7],[18,8],
[19,1],[20,2],  [31,3],[32,4],[33,5],[34,6],[35,7],[36,8],
[37,1],[38,2],                [51,5],[52,6],[53,7],[54,8],
[55,1],[56,2],                [83,5],[84,6],[85,7],[86,8]

]);

export function getValence(atom:Kekule.Atom):number{
    let atomicNumber = atom.atomicNumber;

    if (valenceMap.has(atomicNumber)){
        return valenceMap.get(atomicNumber) as number;
    } else {
        return atom.getValence({ignoreCharge: true});
    }
}

