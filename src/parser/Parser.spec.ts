import { expect } from 'chai';
import { Lexer, ReservedWords } from '../lexer';
import { DottedGetExpression } from './Expression';
import { Parser } from './Parser';
import { PrintStatement } from './Statement';
import { Range } from 'vscode-languageserver';

describe('parser', () => {
    it('emits empty object when empty token list is provided', () => {
        expect(Parser.parse([])).to.deep.include({
            statements: [],
            diagnostics: []
        });
    });

    it('tracks error locations', () => {
        expect(parse(`
            sub main()
                call()a
            end sub
        `).diagnostics.map(x => rangeToArray(x.range))).to.eql([
            [2, 22, 2, 23]
        ]);
    });

    describe('parse', () => {
        it('unknown function type does not invalidate rest of function', () => {
            let { statements, diagnostics } = parse(`
                function log() as UNKNOWN_TYPE
                end function
            `);
            expect(diagnostics.length).to.be.greaterThan(0);
            expect(statements[0]).to.exist;
        });
        it('works with conditionals', () => {
            expect(parse(`
                function printNumber()
                    if true then
                        print 1
                    else if true
                        print 2
                    end if
                end function
            `).diagnostics[0]?.message).not.to.exist;
        });

        it('supports single-line if statements', () => {
            expect(parse(`If true Then print "error" : Stop`).diagnostics[0]?.message).to.not.exist;
        });

        it('works with excess newlines', () => {
            let { tokens } = Lexer.scan(
                'function boolToNumber() as string\n\n' +
                '   if true then\n\n' +
                '       print 1\n\n' +
                '   elseif true then\n\n' +
                '       print 0\n\n' +
                '   else\n\n' +
                '       print 1\n\n' +
                '   end if\n\n' +
                'end function\n\n'
            );
            expect(Parser.parse(tokens).diagnostics[0]?.message).to.not.exist;
        });
        it('does not invalidate entire file when line ends with a period', () => {
            let { tokens } = Lexer.scan(`
                sub main()
                    person.a
                end sub

            `);
            let { diagnostics } = Parser.parse(tokens) as any;
            expect(diagnostics).to.be.lengthOf(1, 'Error count should be 0');
        });

        it.skip('allows printing object with trailing period', () => {
            let { tokens } = Lexer.scan(`print a.`);
            let { statements, diagnostics } = Parser.parse(tokens);
            let printStatement = statements[0] as PrintStatement;
            expect(diagnostics).to.be.empty;
            expect(printStatement).to.be.instanceof(PrintStatement);
            expect(printStatement.expressions[0]).to.be.instanceof(DottedGetExpression);
        });

        describe('comments', () => {
            it('combines multi-line comments', () => {
                let { tokens } = Lexer.scan(`
                    'line 1
                    'line 2
                    'line 3
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be 0');

                expect(statements[0].text).to.equal(`'line 1\n'line 2\n'line 3`);
            });

            it('does not combile comments separated by newlines', () => {
                let { tokens } = Lexer.scan(`
                    'line 1

                    'line 2

                    'line 3
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be 0');

                expect(statements).to.be.lengthOf(3);

                expect(statements[0].text).to.equal(`'line 1`);
                expect(statements[1].text).to.equal(`'line 2`);
                expect(statements[2].text).to.equal(`'line 3`);
            });

            it('works after print statement', () => {
                let { tokens } = Lexer.scan(`
                    sub main()
                        print "hi" 'comment 1
                    end sub
                `);
                let { diagnostics, statements } = Parser.parse(tokens);
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be 0');

                expect((statements as any)[0].func.body.statements[1].text).to.equal(`'comment 1`);
            });

            it('declaration-level', () => {
                let { tokens } = Lexer.scan(`
                    'comment 1
                    function a()
                    end function
                    'comment 2
                `);
                let { diagnostics, statements } = Parser.parse(tokens);
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
                expect((statements as any)[0].text).to.equal(`'comment 1`);
                expect((statements as any)[2].text).to.equal(`'comment 2`);
            });

            it('works in aa literal as its own statement', () => {
                let { tokens } = Lexer.scan(`
                    obj = {
                        "name": true,
                        'comment
                    }
                `);
                let { diagnostics } = Parser.parse(tokens);
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
            });

            it('parses after function call', () => {
                let { tokens } = Lexer.scan(`
                    sub Main()
                        name = "Hello"
                        DoSomething(name) 'comment 1
                    end sub
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Should have zero diagnostics');

                expect(statements[0].func.body.statements[2].text).to.equal(`'comment 1`);
            });

            it('function', () => {
                let { tokens } = Lexer.scan(`
                    function a() 'comment 1
                        'comment 2
                        num = 1
                        'comment 3
                    end function 'comment 4
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Should have zero diagnostics');

                expect(statements[0].func.body.statements[0].text).to.equal(`'comment 1`);
                expect(statements[0].func.body.statements[1].text).to.equal(`'comment 2`);
                expect(statements[0].func.body.statements[3].text).to.equal(`'comment 3`);
                expect(statements[1].text).to.equal(`'comment 4`);
            });

            it('if statement`', () => {
                let { tokens } = Lexer.scan(`
                    function a()
                        if true then 'comment 1
                            'comment 2
                            print "hello"
                            'comment 3
                        else if true then 'comment 4
                            'comment 5
                            print "hello"
                            'comment 6
                        else 'comment 7
                            'comment 8
                            print "hello"
                            'comment 9
                        end if 'comment 10
                    end function
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Should have zero diagnostics');
                let ifStmt = statements[0].func.body.statements[0];

                expect(ifStmt.thenBranch.statements[0].text).to.equal(`'comment 1`);
                expect(ifStmt.thenBranch.statements[1].text).to.equal(`'comment 2`);
                expect(ifStmt.thenBranch.statements[3].text).to.equal(`'comment 3`);

                expect(ifStmt.elseIfs[0].thenBranch.statements[0].text).to.equal(`'comment 4`);
                expect(ifStmt.elseIfs[0].thenBranch.statements[1].text).to.equal(`'comment 5`);
                expect(ifStmt.elseIfs[0].thenBranch.statements[3].text).to.equal(`'comment 6`);

                expect(ifStmt.elseBranch.statements[0].text).to.equal(`'comment 7`);
                expect(ifStmt.elseBranch.statements[1].text).to.equal(`'comment 8`);
                expect(ifStmt.elseBranch.statements[3].text).to.equal(`'comment 9`);

                expect(statements[0].func.body.statements[1].text).to.equal(`'comment 10`);

            });

            it('while', () => {
                let { tokens } = Lexer.scan(`
                    function a()
                        while true 'comment 1
                            'comment 2
                            print "true"
                            'comment 3
                        end while 'comment 4
                    end function
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be zero');
                let stmt = statements[0].func.body.statements[0];

                expect(stmt.body.statements[0].text).to.equal(`'comment 1`);
                expect(stmt.body.statements[1].text).to.equal(`'comment 2`);
                expect(stmt.body.statements[3].text).to.equal(`'comment 3`);

                expect(statements[0].func.body.statements[1].text).to.equal(`'comment 4`);
            });

            it('for', () => {
                let { tokens } = Lexer.scan(`
                    function a()
                        for i = 0 to 10 step 1 'comment 1
                            'comment 2
                            print 1
                            'comment 3
                        end for 'comment 4
                    end function
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be zero');
                let stmt = statements[0].func.body.statements[0];

                expect(stmt.body.statements[0].text).to.equal(`'comment 1`);
                expect(stmt.body.statements[1].text).to.equal(`'comment 2`);
                expect(stmt.body.statements[3].text).to.equal(`'comment 3`);

                expect(statements[0].func.body.statements[1].text).to.equal(`'comment 4`);
            });

            it('for each', () => {
                let { tokens } = Lexer.scan(`
                    function a()
                        for each val in [1,2,3] 'comment 1
                            'comment 2
                            print 1
                            'comment 3
                        end for 'comment 4
                    end function
                `);
                let { diagnostics, statements } = Parser.parse(tokens) as any;
                expect(diagnostics).to.be.lengthOf(0, 'Error count should be zero');
                let stmt = statements[0].func.body.statements[0];

                expect(stmt.body.statements[0].text).to.equal(`'comment 1`);
                expect(stmt.body.statements[1].text).to.equal(`'comment 2`);
                expect(stmt.body.statements[3].text).to.equal(`'comment 3`);

                expect(statements[0].func.body.statements[1].text).to.equal(`'comment 4`);
            });

        });
    });

    describe('reservedWords', () => {
        describe('`then`', () => {
            it('is not allowed as a local identifier', () => {
                let { diagnostics } = parse(`
                    sub main()
                        then = true
                    end sub
                `);
                expect(diagnostics).to.be.lengthOf(1);
            });
            it('is allowed as an AA property name', () => {
                let { diagnostics } = parse(`
                    sub main()
                        person = {
                            then: true
                        }
                        person.then = false
                        print person.then
                    end sub
                `);
                expect(diagnostics[0]?.message).not.to.exist;
            });
        });
        it('"end" is not allowed as a local identifier', () => {
            let { diagnostics } = parse(`
                sub main()
                    end = true
                end sub
            `);
            expect(diagnostics).to.be.lengthOf(1);
        });
        it('none of them can be used as local variables', () => {
            let reservedWords = new Set(ReservedWords);
            //remove the rem keyword because it's a comment...won't cause error
            reservedWords.delete('rem');
            for (let reservedWord of reservedWords) {
                let { tokens } = Lexer.scan(`
                    sub main()
                        ${reservedWord} = true
                    end sub
                `);
                let { diagnostics } = Parser.parse(tokens);
                expect(diagnostics, `assigning to reserved word "${reservedWord}" should have been an error`).to.be.length.greaterThan(0);
            }
        });
    });
});

function parse(text: string) {
    let { tokens } = Lexer.scan(text);
    return Parser.parse(tokens);
}

export function rangeToArray(range: Range) {
    return [
        range.start.line,
        range.start.character,
        range.end.line,
        range.end.character
    ];
}