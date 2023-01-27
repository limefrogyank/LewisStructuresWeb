import { OpenBabelModule } from './lewisStructureCanvas';

function obBaseToKekule(ob: OpenBabelModule, obBase:OpenBabelModule.OBMol, kMol:Kekule.Molecule){
    var result = kMol || new Kekule.Molecule();
		var helper = new ob.ObBaseHelper(obBase);
		// title
		var title = helper.getTitle();
		if (title && result.setName)
			result.setName(title);
		// TODO: data info, how to convert exactly?
		var dataSize = helper.getDataSize();
		if (dataSize)
		{
			var info = result.getInfo(true);
			for (var i = 0; i < dataSize; ++i)
			{
				var data = helper.getDataAt(i);
				if (data)
				{
					var key = data.GetAttribute();
					var value = data.GetValue();
					if (key && value)
						info[key] = value;
				}
			}
		}
		return result;
}

export function obMolToKekule(ob: OpenBabelModule, obMol:OpenBabelModule.OBMol, kMol:Kekule.Molecule, childObjMap:any) : Kekule.Molecule{
    var result = kMol;

		// TODO: The bond of OBMol often has a implicit stereo, wedge/hash and so on must be calculated from
		//  separate OBStereoData field of OBMol, which is very complex. So here we simply use MOL format string
		//  to convert from OBMol and Kekule.Molecule
		var conv = new ob.ObConversionWrapper();
		try
		{
			conv.setOutFormat('', 'mol');
			var sMolData = conv.writeString(obMol, false);
			var mol2 = Kekule.IO.loadFormatData(sMolData, "mol");
			if (!result)
				result = mol2;
			else
				result.assign(mol2);
			mol2.finalize();
		}
		finally
		{
			conv['delete']();
		}

        obBaseToKekule(ob, obMol,result);
		
		// fill the childObjMap
		if (childObjMap)
		{
			// atoms
			var count = obMol.NumAtoms();
			if (count === result.getNodeCount())  // atom count matches, now we can do the mapping
			{
				for (var i = 0; i < count; ++i)
				{
					var obAtom = obMol.GetAtom(i + 1);  // NOTE: in OpenBabel, currently atom index starts from 1
					if (obAtom)
					{
						var kNode = result.getNodeAt(i);
						if (kNode)
							childObjMap.set(obAtom, kNode);
					}
				}
			}
			// bonds
			var count = obMol.NumBonds();
			if (count === result.getConnectorCount())  // bond count matches, now we can do the mapping
			{
				for (var i = 0; i < count; ++i)
				{
					var obBond = obMol.GetBond(i);  // NOTE: in OpenBabel, bond index starts from 0
					if (obBond)
					{
						var kBond = result.getConnectorAt(i);
						if (kBond)
							childObjMap.set(obBond, kBond);
					}
				}
			}
		}
    return result;
}