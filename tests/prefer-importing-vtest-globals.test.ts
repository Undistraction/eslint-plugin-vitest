import dedent from "dedent"
import rule from "../src/rules/prefer-importing-vitest-globals"
import { ruleTester } from "./ruleTester"

ruleTester.run("prefer-importing-vitest-globals", rule, {
  valid: [
    {
      code: dedent`
        // with import
        import { test, expect } from 'vitest';
        test('should pass', () => {
            expect(true).toBeDefined();
        });
      `,
      languageOptions: { parserOptions: { sourceType: "module" } },
    },
    {
      code: dedent`
        test('should pass', () => {
            expect(true).toBeDefined();
        });
      `,
      options: [{ types: ["vitest"] }],
      languageOptions: { parserOptions: { sourceType: "module" } },
    },
    {
      code: dedent`
        const { it } = require('vitest');
        it('should pass', () => {
            expect(true).toBeDefined();
        });
      `,
      options: [{ types: ["test"] }],
      languageOptions: { parserOptions: { sourceType: "module" } },
    },
    {
      code: dedent`
        // with require
        const { test, expect } = require('vitest');
        test('should pass', () => {
            expect(true).toBeDefined();
        });
      `,
    },
    {
      code: dedent`
        const { test, expect } = require(\`vitest\`);
        test('should pass', () => {
            expect(true).toBeDefined();
        });
      `,
    },
    {
      code: dedent`
        import { it as itChecks } from 'vitest';
        itChecks("foo");
      `,
      languageOptions: { parserOptions: { sourceType: "module" } },
    },
    {
      code: dedent`
        const { test } = require('vitest');
        test("foo");
      `,
    },
    {
      code: dedent`
        const { test } = require('my-test-library');
        test("foo");
      `,
    },
  ],
  invalid: [
    {
      code: dedent`
        import describe from 'vitest';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      output: dedent`
        import { describe, expect, test } from 'vitest';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 7,
          column: 3,
          line: 3,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        vi.useFakeTimers();
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      output: dedent`
        import { vi } from 'vitest';
        vi.useFakeTimers();
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })`,
      options: [{ types: ["vi"] }],
      errors: [
        {
          endColumn: 3,
          column: 1,
          line: 1,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        import React from 'react';
        import { yourFunction } from './yourFile';
        import something from "something";
        import { test } from 'vitest';
        import { xit } from 'vitest';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      output: dedent`
        import React from 'react';
        import { yourFunction } from './yourFile';
        import something from "something";
        import { describe, expect, test } from 'vitest';
        import { xit } from 'vitest';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 6,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    // {
    //   code: dedent`
    //     console.log('hello');
    //     import * as fs from 'fs';
    //     const { test, 'describe': describe } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   output: dedent`
    //     console.log('hello');
    //     import * as fs from 'fs';
    //     import { describe, expect, test } from 'vitest';
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   errors: [
    //     {
    //       endColumn: 9,
    //       column: 3,
    //       line: 6,
    //       messageId: "preferImportingVitestGlobals",
    //     },
    //   ],
    // },
    {
      code: dedent`
        console.log('hello');
        import vitest from 'vitest';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      output: dedent`
        console.log('hello');
        import { describe, expect, test, vitest } from 'vitest';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 3,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        import { pending } from 'actions';
        describe('foo', () => {
          test.each(['hello', 'world'])("%s", (a) => {});
        });
      `,
      output: dedent`
        import { pending } from 'actions';
        import { describe, test } from 'vitest';
        describe('foo', () => {
          test.each(['hello', 'world'])("%s", (a) => {});
        });
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 2,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    // Fails because added/fixed imports are not merged with existing imports
    // {
    //   code: dedent`
    //     const {describe} = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   languageOptions: { parserOptions: { sourceType: "commonjs" } },
    //   output: dedent`
    //     const { describe, expect, test } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   errors: [
    //     {
    //       endColumn: 7,
    //       column: 3,
    //       line: 3,
    //       messageId: "preferImportingVitestGlobals",
    //     },
    //   ],
    // },
    // Fails because added/fixed imports are not merged with existing imports
    // {
    //   code: dedent`
    //     const {describe} = require(\`vitest\`);
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   languageOptions: { parserOptions: { sourceType: "commonjs" } },
    //   // todo: we should really maintain the template literals
    //   output: dedent`
    //     const { describe, expect, test } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   errors: [
    //     {
    //       endColumn: 7,
    //       column: 3,
    //       line: 3,
    //       messageId: "preferImportingVitestGlobals",
    //     },
    //   ],
    // },
    {
      code: dedent`
        const source = 'globals';
        const {describe} = require(\`vitest\`);
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      languageOptions: { parserOptions: { sourceType: "commonjs" } },
      // todo: this shouldn't be indenting the "test"
      output: dedent`
        const source = 'globals';
        const {describe} = require(\`vitest\`);
        describe("suite", () => {
          const { expect, test } = require('vitest');
        test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 7,
          column: 3,
          line: 4,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    // Fails because it's adding a broken import for the original import and
    // isn't converting the other imports to use module imports.
    // {
    //   code: dedent`
    //     const { [() => {}]: it } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   output: dedent`
    //     const { describe, expect, test } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   errors: [
    //     {
    //       endColumn: 9,
    //       column: 1,
    //       line: 2,
    //       messageId: "preferImportingVitestGlobals",
    //     },
    //   ],
    // },
    // Fails because it isn't applying the additional imports
    // {
    //   code: dedent`
    //     console.log('hello');
    //     const fs = require('fs');
    //     const { test, 'describe': describe } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   languageOptions: { parserOptions: { sourceType: "commonjs" } },

    //   output: dedent`
    //     console.log('hello');
    //     const fs = require('fs');
    //     const { describe, expect, test } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   errors: [
    //     {
    //       endColumn: 9,
    //       column: 3,
    //       line: 6,
    //       messageId: "preferImportingVitestGlobals",
    //     },
    //   ],
    // },
    // Fails because it isn't switching the existing import for the named
    // imports
    // {
    //   code: dedent`
    //     console.log('hello');
    //     const vitest = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   languageOptions: { parserOptions: { sourceType: "commonjs" } },
    //   output: dedent`
    //     console.log('hello');
    //     const { describe, expect, test } = require('vitest');
    //     describe("suite", () => {
    //       test("foo");
    //       expect(true).toBeDefined();
    //     })
    //   `,
    //   errors: [
    //     {
    //       endColumn: 9,
    //       column: 1,
    //       line: 3,
    //       messageId: "preferImportingVitestGlobals",
    //     },
    //   ],
    // },
    {
      code: dedent`
        const { pending } = require('actions');
        describe('foo', () => {
          test.each(['hello', 'world'])("%s", (a) => {});
        });
      `,
      languageOptions: { parserOptions: { sourceType: "commonjs" } },
      output: dedent`
        const { pending } = require('actions');
        const { describe, test } = require('vitest');
        describe('foo', () => {
          test.each(['hello', 'world'])("%s", (a) => {});
        });
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 2,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      languageOptions: { parserOptions: { sourceType: "commonjs" } },
      output: dedent`
        const { describe, expect, test } = require('vitest');
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 1,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        #!/usr/bin/env node
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      output: dedent`
        #!/usr/bin/env node
        const { describe, expect, test } = require('vitest');
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      languageOptions: { parserOptions: { sourceType: "script" } },
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 2,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        // with comment above
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      languageOptions: { parserOptions: { sourceType: "commonjs" } },
      output: dedent`
        // with comment above
        const { describe, expect, test } = require('vitest');
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 2,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        'use strict';
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      languageOptions: { parserOptions: { sourceType: "commonjs" } },
      output: dedent`
        'use strict';
        const { describe, expect, test } = require('vitest');
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 2,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
    {
      code: dedent`
        \`use strict\`;
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      languageOptions: { parserOptions: { sourceType: "commonjs" } },
      output: dedent`
        \`use strict\`;
        const { describe, expect, test } = require('vitest');
        describe("suite", () => {
          test("foo");
          expect(true).toBeDefined();
        })
      `,
      errors: [
        {
          endColumn: 9,
          column: 1,
          line: 2,
          messageId: "preferImportingVitestGlobals",
        },
      ],
    },
  ],
})
