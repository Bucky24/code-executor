const { StateManager } = require("../src/stateManager");

describe('StateManager', () => {
  describe('processToken', () => {
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

  describe('generate', () => {
    it('should fail if function is provided', () => {
      const manager = new StateManager({
        start: function() {
          manager.setState('stub', {
            stub: 'start_stub',
          });
          return true;
        },
        stub: function() {},
      }, 'start');

      manager.processToken('');
      manager.popAll();

      expect(() => manager.generate('lang')).toThrow('processStatement requires a class but stub is a function');
    });

    it('should provide expected output', () => {
      class StubClass {
        static process(token, context, manager) {
          return true;
        }

        static generate(statement, lang) {
          expect(lang).toBe('lang');
          return `stub_${statement.stub}`;
        }
      }
      const manager = new StateManager({
        start: function(token, context, manager) {
          manager.setState('stub', {
            stub: token,
          });
          return true;
        },
        stub: StubClass,
      }, 'start');

      manager.processToken('a');
      manager.popAll();

      const result = manager.generate('lang');
      expect(result[0]).toBe('stub_a');
    });

    it('should handle any nesting', () => {
      class StubA {
        static process(token, context, manager) {
          return true;
        }

        static generate(statement, lang, manager) {
          expect(lang).toBe('lang');
          return `stub_${manager.processStatement({ state: 'stubb', stub: statement.stub }, lang)}`;
        }
      }

      class StubB {
        static process(token, context, manager) {
          return true;
        }

        static generate(statement, lang) {
          expect(lang).toBe('lang');
          return statement.stub;
        }
      }
      const manager = new StateManager({
        start: function(token, context, manager) {
          manager.setState('stuba', {
            stub: token,
          });
          return true;
        },
        stuba: StubA,
        stubb: StubB,
      }, 'start');

      manager.processToken('a');
      manager.popAll();

      const result = manager.generate('lang');
      expect(result[0]).toBe('stub_a');
    });
  });
});