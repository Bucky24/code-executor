const { StateManager } = require("../src/stateManager");
const { STRUCTURE_TYPE } = require("../src/types");

describe('StateManager', () => {
  describe('processCode', () => {
    it('should correctly call the default state', async () => {
      class Start {
        static processToken(token, context, manager) {
          manager.setState('stub', {
            stub: 'start_stub',
          });
          return true;
        }
      }
      class Stub {
        static processInternal(statement) {
          return {
            type: STRUCTURE_TYPE.BLOCK,
            children: [],
          };
        }
      }
      const manager = new StateManager();
      manager.registerLanguage('lang', {
        start: Start,
        stub: Stub,
      }, {}, 'start', []);

      manager.setCurrentLanguage('lang');
      await manager.processCode(' ');
      const statements = manager.getStatements();

      expect(statements[0]).toStrictEqual({
        type: STRUCTURE_TYPE.BLOCK,
        children: [],
      });
    });

    it('should error if current state does not handle token', async () => {
      class Start {
        static processToken(token, context, manager) {
          // nothing
        }
      }
      const manager = new StateManager();
      manager.registerLanguage('lang', {
        start: Start,
      }, {}, 'start', []);
      manager.setCurrentLanguage('lang');

      await expect(() => manager.processCode(' ')).rejects.toThrow('Unxpected token " " at state start/lang');
    });

    it('should fail if function is provided', async () => {
      class Start {
        static processToken(token, context, manager) {
          manager.setState('stub', {
            stub: 'start_stub',
          });
          return true;
        }
      }
      const manager = new StateManager();

      manager.registerLanguage('lang', {
        start: Start,
        stub: function() {},
      }, {}, 'start', []);
      manager.setCurrentLanguage('lang');

      await expect(() => manager.processCode(' ')).rejects.toThrow('State stub/lang does not map to a class');
    });
  });

  describe('generate', () => {
    it('should provide expected output', async () => {
      class Start {
        static processToken(token, context, manager) {
          manager.setState('stub', {
            stub: token,
          });
          return true;
        }
      }
      class StubClass {
        static processInternal(statement, manager) {
          return {
            type: STRUCTURE_TYPE.BLOCK,
            children: [],
          };
        }

        static generateInternal(statement, manager) {
          return `stub_${statement.stub}`;
        }
      }
      const manager = new StateManager();
      manager.registerLanguage('lang', {
        start: Start,
        stub: StubClass,
      }, {
        [STRUCTURE_TYPE.BLOCK]: (statement, manager) => {
          return {
            state: 'stub',
            stub: 'a',
          };
        },
      }, 'start', []);

      manager.setCurrentLanguage('lang');
      await manager.processCode('a');

      const result = manager.generate();
      expect(result[0]).toBe('stub_a');
    });

    it('should handle any nesting', async () => {
      class Start {
        static processToken(token, context, manager) {
          manager.setState('stuba', {
            stub: token,
          });
          return true;
        }
      }

      class StubA {
        static processInternal(statement, manager) {
          return {
            type: STRUCTURE_TYPE.BLOCK,
            children: [],
          };
        }

        static generateInternal(statement, manager) {
          return `stub_${manager.generateInternalStatement({ state: 'stubb', stub: statement.stub })}`;
        }
      }

      class StubB {
        static generateInternal(statement) {
          return statement.stub;
        }
      }
      const manager = new StateManager();
      manager.registerLanguage('lang', {
        start: Start,
        stuba: StubA,
        stubb: StubB,
      }, {
        [STRUCTURE_TYPE.BLOCK]: (statement, manager) => {
          return {
            state: 'stuba',
            stub: 'a',
          };
        }
      }, 'start', []);

      manager.setCurrentLanguage('lang');
      await manager.processCode('a');

      const result = manager.generate();
      expect(result[0]).toBe('stub_a');
    });
  });
});