# Dealer asset provenance

- Author: Quaternius
- Pack: Universal Base Characters, **free Standard** edition
- Original model: `Superhero_Male_FullBody.gltf` + `.bin` (not the paid Source edition)
- Official source: https://quaternius.com/packs/universalbasecharacters.html
- Official download: https://quaternius.itch.io/universal-base-characters
- License: CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/
- Pack license is preserved in `License_Standard.txt`.
- CC0 permits commercial use, modification, web distribution and redistribution in this public repository. Attribution is not required; provenance is retained voluntarily. No Mixamo assets or paid services are used.

## Adaptation

The original continuous body topology and 65-joint skin are retained. Arm cross-sections and chest depth are reshaped in bind space; normals are recalculated. Runtime shoulder offsets and hand scale refine proportions without changing the skeleton hierarchy. Eye/eyebrow meshes and textures are removed. Matte vertex colors represent a white long-sleeved shirt, dark trousers and shaded head. A fitted waistcoat is clipped from the original torso surface, offset outward, and uses interpolated original skin weights. Collar and tapered tie are projected onto the chest surface with barycentrically interpolated skin weights. The runtime drives shoulder/elbow/wrist/finger bones with two-bone IK and smooth gestures.

Rebuild: download the free Standard archive, extract the Godot/UE male glTF and bin into one folder, then run `python3 scripts/build-dealer.py /path/to/folder` from the repository root. Python standard library only. Source bin SHA256: `459003f9745853ae562a85506a2b94dd56515c1f37728f9fa3d2ce1a3e4cd92f`.

Only the adapted GLB is distributed; the large source archive is not included. The final model has slimmer proportions and remains a stylized game character, not a photorealistic tailored character. Finger gripping and physical card contact are not simulated.

## Reference-guided posture revision

The original model faces +Z, confirmed from the eye meshes. Runtime orientation and garment projection now use this front consistently. Mirrored collar triangle winding is corrected. Collar/tie patches are subdivided and projected to the actual chest; three skinned waistcoat buttons are included. A restrained waist taper and slimmer arm cross-sections are combined with uniform arm-bone extension (1.10 upper, 1.03 lower relative), with sleeve and hand compensation to prevent unintended scaling. The 65-bone hierarchy, original body topology, license and animation timing remain unchanged. The reference photograph is not included or displayed in the application.
