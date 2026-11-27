import { InteractionController } from './interaction.controller';
import type { InteractionOptions } from './interaction.controller';

describe('InteractionController', () => {
  it('does not overwrite keyboard hover while pointer hover is suspended', () => {
    const canvas = document.createElement('canvas');
    let hoverCalls = 0;
    const options = {
      canvas,
      isHoverSuspended: () => true,
      onHover: () => hoverCalls++,
    } as unknown as InteractionOptions;
    const controller = new InteractionController(options);

    controller.checkHover();

    expect(hoverCalls).toBe(0);
    controller.destroy();
  });
});
