const { StateManager } = require("../src/stateManager");

describe('StateManager', () => {
  it('should correctly call the default state', () => {
    const manager = new StateManager({
      start: (token, context, manager) => {
        manager.setState('stub', {
          stub: 'start_stub',
        });
        return true;
      },
    }, 'start');

    manager.processToken('');
    manager.popAll();
    const statements = manager.getStatements();

    expect(statements[0]).toStrictEqual({
      state: 'stub',
      children: undefined,
      stub: 'start_stub',
    });
  });

  it('should error if current state does not handle token', () => {
    const manager = new StateManager({
      start: (token, context, manager) => {
        // nothing
      },
    }, 'start');

    expect(() => manager.processToken('')).toThrow('Unxpected token "" at state start');
  });
});