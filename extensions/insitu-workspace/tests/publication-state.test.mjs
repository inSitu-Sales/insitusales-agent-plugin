import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationState, supportDetails} from '../web/publication-state.mjs';
test('stale activity becomes uncertain, never an endless progress indicator',()=>{
 const result={status:'uploading',recordedAt:'2026-10-28T12:00:00Z',outcome:'unknown'};
 assert.equal(publicationState(result,Date.parse('2026-10-28T12:01:00Z')).busy,true);
 assert.equal(publicationState(result,Date.parse('2026-10-28T12:04:00Z')).tone,'warning');
 assert.equal(publicationState({status:'activation_pending'}).tone,'warning');
 assert.equal(publicationState({status:'activation_unconfirmed',httpStatus:502}).tone,'warning');
 assert.equal(publicationState({status:'active'}).tone,'success');
});
test('unknown server error never claims the old store is unchanged',()=>{
 assert.equal(publicationState({httpStatus:500,outcome:'unknown'}).title,'Publicación sin confirmar');
 assert.match(publicationState({code:'LOCAL_FILE_ACCESS',outcome:'not_started'}).description,/no comenzó/);
});
test('support export includes correlations but excludes credentials and local paths',()=>{
 const d=supportDetails({name:'Store',path:'/private'},{code:'FAIL',attemptId:'a',authorization:'secret',grant:{},rawBody:'secret',httpStatus:500});
 assert.equal(d.requestId,'No recibido del servidor'); assert.equal(d.httpStatus,500);
 assert.doesNotMatch(JSON.stringify(d),/secret|private|grant/);
});

test('DNS failure is explained without asserting permission denial',()=>{
 const state=publicationState({code:'PUBLICATION_CONNECTION_FAILED',transportCode:'ENOTFOUND',outcome:'not_started'});
 assert.match(state.title,/resolver/);
 assert.match(state.description,/no confirma/);
 assert.equal(state.action,'diagnose');
 assert.equal(publicationState({code:'LOCAL_PERMISSION_DENIED',outcome:'not_started'}).action,'diagnose');
});

test('HTTP preflight rejection offers diagnosis without implying an upload', () => {
 const state = publicationState({code:'PUBLICATION_PREFLIGHT_REJECTED',outcome:'not_started',httpStatus:500});
 assert.equal(state.action,'diagnose');
 assert.match(state.description,/La subida no comenzó/);
});
