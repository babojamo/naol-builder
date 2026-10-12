import test from 'node:test';import assert from 'node:assert/strict';
import {shouldSkipProfileRefresh} from '../lib/auth-refresh';

test('same-user access token refresh does not reload profile or churn account UI',()=>{
 assert.equal(shouldSkipProfileRefresh('TOKEN_REFRESHED','user-1','user-1'),true);
});

test('sign-in, sign-out, user updates, and identity changes still refresh profile state',()=>{
 assert.equal(shouldSkipProfileRefresh('SIGNED_IN','user-1','user-1'),false);
 assert.equal(shouldSkipProfileRefresh('USER_UPDATED','user-1','user-1'),false);
 assert.equal(shouldSkipProfileRefresh('TOKEN_REFRESHED','user-1','user-2'),false);
 assert.equal(shouldSkipProfileRefresh('TOKEN_REFRESHED','user-1',null),false);
});
