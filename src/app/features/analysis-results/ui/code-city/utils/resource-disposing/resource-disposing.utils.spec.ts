import * as THREE from 'three';

import { UNIT_CUBE } from '../../code-city.model';
import { disposeMesh, disposeMeshes } from './resource-disposing.utils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('disposeMesh', () => {
  it('preserves shared cube geometry and disposes its mesh material', () => {
    const material = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(UNIT_CUBE, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');

    disposeMesh(new THREE.Mesh(UNIT_CUBE, material));

    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('disposes owned geometry and each material in an array', () => {
    const geometry = new THREE.BoxGeometry();
    const materials = [new THREE.MeshBasicMaterial(), new THREE.MeshPhongMaterial()];
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDisposals = materials.map((material) => vi.spyOn(material, 'dispose'));

    disposeMeshes([new THREE.Mesh(geometry, materials)]);

    expect(geometryDispose).toHaveBeenCalledOnce();
    for (const dispose of materialDisposals) expect(dispose).toHaveBeenCalledOnce();
  });
});
