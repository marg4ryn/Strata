import type { Mesh } from 'three';

import { UNIT_CUBE } from '../../code-city.model';

export function disposeMesh(mesh: Mesh): void {
  if (mesh.geometry !== UNIT_CUBE) mesh.geometry.dispose();

  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => material.dispose());
  } else {
    mesh.material.dispose();
  }
}

export function disposeMeshes(meshes: readonly Mesh[]): void {
  meshes.forEach(disposeMesh);
}
