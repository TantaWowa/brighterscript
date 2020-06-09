/* eslint-disable @typescript-eslint/no-for-in-array */
import { expect } from 'chai';
import { DiagnosticMessages } from '../../../DiagnosticMessages';
import { TokenKind, Lexer } from '../../../lexer';
import { Parser, ParseMode } from '../../Parser';
import { token, EOF } from '../Parser.spec';
import { BrsString, BrsBoolean } from '../../../brsTypes';
import { AssignmentStatement, ExpressionStatement, ForEachStatement } from '../../Statement';
import {
    AALiteralExpression,
    ArrayLiteralExpression,
    CallExpression,
    ConditionalExpression,
    LiteralExpression
} from '../../Expression';
import { Program } from '../../../Program';
import { getTestTranspile } from '../../../files/BrsFile.spec';

describe('parser conditional expressions', () => {
    it('throws exception when used in brightscript scope', () => {
        let { tokens } = Lexer.scan(`a = true ? "human" : "Zombie"`);
        let { diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrightScript });
        expect(diagnostics[0]?.message).to.equal(DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('ternary operator').message);
    });

    describe('conditional expressions as statements are not supported', () => {
        it('basic statement', () => {
            let { statements, diagnostics } = Parser.parse([
                token(TokenKind.True, 'true', BrsBoolean.True),
                token(TokenKind.QuestionMark, '?'),
                token(TokenKind.StringLiteral, 'Human', new BrsString('Human')),
                token(TokenKind.Colon, ':'),
                token(TokenKind.StringLiteral, 'Zombie', new BrsString('Zombie')),
                EOF
            ], { mode: ParseMode.BrighterScript });

            expect(diagnostics).to.not.be.empty;
            expect(statements).to.exist;
            expect(statements).to.be.empty;
        });

        it(`does not supports various tests with primitive values:`, () => {
        //test as property
            for (const test in [
                'true',
                'false',
                'len("person") = 10',
                'm.getResponse()',
                'm.myZombies[3].ifFed = true'
            ]) {

                let { tokens } = Lexer.scan(`${test} ? "human" : "zombie"`);
                let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
                expect(diagnostics).to.not.be.empty;
                expect(statements).to.exist;
                expect(statements).to.be.empty;
            }
        });
    });

    it(`supports simple assign:`, () => {
        let { tokens } = Lexer.scan(`being = isZombie = false ? "human" : "zombie"`);
        let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
        expect(diagnostics).to.be.empty;
        expect(statements).to.exist;
        expect(statements).to.not.be.empty;
    });
    it(`supports complex test:`, () => {
        let { tokens } = Lexer.scan(`a = user.getAccount() ? "logged in" : "not logged in"`);
        let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
        expect(diagnostics).to.be.empty;
        expect(statements).to.exist;
        expect(statements).to.not.be.empty;
    });

    describe('conditional expressions - variety of test cases', () => {
        it(`does not supports various tests with primitive values:`, () => {
            //test as property
            for (const test in [
                'result = true',
                'result = false',
                'result = len("person") = 10',
                'result = m.getResponse()',
                'result = m.myZombies[3].ifFed = true'
            ]) {

                let { tokens } = Lexer.scan(`${test} ? "human" : "zombie"`);
                let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
                expect(diagnostics).to.not.be.empty;
                expect(statements).to.exist;
                expect(statements).to.be.empty;
            }
        });

        it(`supports non-primitive consequents:`, () => {
        //test as property
            for (const consequent in [
                'true',
                'false',
                'len("person") = 10',
                'm.getResponse()',
                'm.myZombies[3].ifFed = true',
                'getZombieName'
            ]) {

                let { tokens } = Lexer.scan(`result = true ? ${consequent} : "zombie"`);
                let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
                expect(diagnostics).to.be.lengthOf(0);
                expect(statements[0]).instanceof(AssignmentStatement);
                expect((statements[0] as AssignmentStatement).value).instanceof(ConditionalExpression);

            }
        });

        it(`supports non-primitive alternates:`, () => {
        //test as property
            for (const alternate in [
                'true',
                'false',
                'len("person") = 10',
                'm.getResponse()',
                'm.myZombies[3].ifFed = true',
                'getZombieName'
            ]) {

                let { tokens } = Lexer.scan(`result = true ? "zombie" : ${alternate}`);
                let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
                expect(diagnostics).to.be.lengthOf(0);
                expect(statements[0]).instanceof(AssignmentStatement);
                expect((statements[0] as AssignmentStatement).value).instanceof(ConditionalExpression);
            }
        });
    });
    describe('in assignment', () => {
        it(`simple case`, () => {
            let { tokens } = Lexer.scan(`a = true ? "human" : "zombie"`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
        });

        it(`multi line arrays case`, () => {
            let { tokens } = Lexer.scan(`a = true ? [
          "one"
          "two"
          "three"] : [
          "one"
          "two"
          "three"]`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
        });
        it(`single line assoc array`, () => {
            let { tokens } = Lexer.scan(`a = true ? {"a":"a"} : {}`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
        });
        it(`multi line assoc array`, () => {
            let { tokens } = Lexer.scan(`a = true ? {"a":"a"} : {
          "b": "test"
          }`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
        });
        it(`multi line assoc array - both sides`, () => {
            let { tokens } = Lexer.scan(`a = true ? {
          "a":"a"
          "b":"b"
          } : {
          "b": "test"
          }`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
        });

        it(`in func call with array args`, () => {
            let { tokens } = Lexer.scan(`m.eatBrains(a.count() > 10 ? ["a","B"] : ["c", "d"])`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(ExpressionStatement);
            expect((statements[0] as ExpressionStatement).expression).instanceof(CallExpression);
            let callExpression = (statements[0] as ExpressionStatement).expression as CallExpression;
            expect(callExpression.args.length).to.equal(1);
            expect(callExpression.args[0]).instanceof(ConditionalExpression);
        });

        it(`in func call with aa args`, () => {
            let { tokens } = Lexer.scan(`m.eatBrains(a.count() > 10 ? {"a":1} : {"b": ["c", "d"]})`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(ExpressionStatement);
            expect((statements[0] as ExpressionStatement).expression).instanceof(CallExpression);
            let callExpression = (statements[0] as ExpressionStatement).expression as CallExpression;
            expect(callExpression.args.length).to.equal(1);
            expect(callExpression.args[0]).instanceof(ConditionalExpression);
        });

        it(`in simple func call`, () => {
            let { tokens } = Lexer.scan(`m.eatBrains(a = true ? "a" : "b")`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(ExpressionStatement);
            expect((statements[0] as ExpressionStatement).expression).instanceof(CallExpression);
            let callExpression = (statements[0] as ExpressionStatement).expression as CallExpression;
            expect(callExpression.args.length).to.equal(1);
            expect(callExpression.args[0]).instanceof(ConditionalExpression);
        });

        it(`in func call with more args`, () => {
            let { tokens } = Lexer.scan(`m.eatBrains(a = true ? "a" : "b", true, 12)`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(ExpressionStatement);
            expect((statements[0] as ExpressionStatement).expression).instanceof(CallExpression);
            let callExpression = (statements[0] as ExpressionStatement).expression as CallExpression;
            expect(callExpression.args.length).to.equal(3);
            expect(callExpression.args[0]).instanceof(ConditionalExpression);
        });

        it(`in func call with more args, and comparing value`, () => {
            let { tokens } = Lexer.scan(`m.eatBrains((a = true ? "a" : "b").count() = 3, true, 12)`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(ExpressionStatement);
            expect((statements[0] as ExpressionStatement).expression).instanceof(CallExpression);
            let callExpression = (statements[0] as ExpressionStatement).expression as CallExpression;
            expect(callExpression.args.length).to.equal(3);
        });

        it(`in array`, () => {
            let { tokens } = Lexer.scan(`a = [a = true ? {"a":"a"} : {"b":"b"}, "c"]`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
            expect((statements[0] as AssignmentStatement).value).instanceof(ArrayLiteralExpression);
            let literalExpression = (statements[0] as AssignmentStatement).value as ArrayLiteralExpression;
            expect(literalExpression.elements[0]).instanceOf(ConditionalExpression);
            expect(literalExpression.elements[1]).instanceOf(LiteralExpression);
        });
        it(`in aa`, () => {
            let { tokens } = Lexer.scan(`a = {"v1": a = true ? {"a":"a"} : {"b":"b"}, "v2": "c"}`);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(AssignmentStatement);
            expect((statements[0] as AssignmentStatement).value).instanceof(AALiteralExpression);
            let literalExpression = (statements[0] as AssignmentStatement).value as AALiteralExpression;
            expect((literalExpression.elements[0] as any).key.value).is.equal('v1');
            expect((literalExpression.elements[0] as any).value).instanceOf(ConditionalExpression);
            expect((literalExpression.elements[1] as any).key.value).is.equal('v2');
            expect((literalExpression.elements[1] as any).value).instanceOf(LiteralExpression);
        });
        it(`in for each`, () => {
            let { tokens } = Lexer.scan(`for each person in isZombieMode ? zombies : humans
                ? "person is " ; person
            end for
            `);
            let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
            expect(diagnostics).to.be.lengthOf(0);
            expect(statements[0]).instanceof(ForEachStatement);
            expect((statements[0] as ForEachStatement).target).instanceof(ConditionalExpression);
        });

    });
});


describe('transpilation', () => {
    let rootDir = process.cwd();
    let program: Program;
    let testTranspile = getTestTranspile(() => [program, rootDir]);

    beforeEach(() => {
        program = new Program({ rootDir: rootDir });
    });
    afterEach(() => {
        program.dispose();
    });

    it('properly transpiles ternary assignments - simple', async () => {
        await testTranspile(`a = user = invalid ? "no user" : "logged in"`, `a = bslib_simpleTernary(user = invalid, "no user", "logged in") `, 'none');
    });

    it('properly transpiles ternary assignments - complex consequent', async () => {
        await testTranspile(`a = user.getAccount() ? "logged in" : "not logged in"`, 'a = bslib_scopeSafeTernary(user.getAccount(), {\n  "user": user\n},function(scope)\n  return "logged in"\nend function\n function(scope)\n  return "not logged in"\nend function) ', 'none');
    });

    it('properly transpiles ternary assignments - complex alternate', async () => {
        await testTranspile(`a = user ? m.defaults.getAccount(settings.name) : "no"`, 'a = bslib_scopeSafeTernary(user, {\n  "user": user\n  "settings": settings\n  "m": m\n},function(scope)\n  settings = scope.settings\n  m = scope.m\n  return m.defaults.getAccount(settings.name)\nend function\n function(scope)\n  return "no"\nend function) ', 'none');
    });
});
