import type { InstanceData, InstanceMap } from '../../code-city.model';
import { createInstancePathMap, findInstanceByPath } from './instance-finding.utils';

describe('instance-finding.utils', () => {
  describe('createInstancePathMap', () => {
    it('indexes instances by path and keeps the first entry for duplicate paths', () => {
      const firstInstance = { node: { path: '/src/file.ts' } } as InstanceData;
      const duplicateInstance = { node: { path: '/src/file.ts' } } as InstanceData;
      const otherInstance = { node: { path: '/src/other.ts' } } as InstanceData;
      const instanceMap: InstanceMap = new Map([
        ['building_0', firstInstance],
        ['building_1', duplicateInstance],
        ['building_2', otherInstance],
      ]);

      const instancePathMap = createInstancePathMap(instanceMap);

      expect(instancePathMap.size).toBe(2);
      expect(findInstanceByPath(instancePathMap, '/src/file.ts')).toBe(firstInstance);
      expect(findInstanceByPath(instancePathMap, '/src/other.ts')).toBe(otherInstance);
      expect(findInstanceByPath(instancePathMap, '/missing.ts')).toBeUndefined();
    });
  });
});
