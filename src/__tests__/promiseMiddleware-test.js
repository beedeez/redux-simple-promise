import promiseMiddleware from '../';
import { spy } from 'sinon';
import { resolve, reject } from '../';

function noop() {}
const GIVE_ME_META = 'GIVE_ME_META';
function metaMiddleware() {
  return next => action =>
    action.type === GIVE_ME_META
      ? next({ ...action, meta: 'here you go' })
      : next(action);
}

describe('promiseMiddleware', () => {
  let baseDispatch;
  let dispatch;
  let foobar;
  let err;

  beforeEach(() => {
    baseDispatch = spy();
    dispatch = function d(action) {
      const methods = { dispatch: d, getState: noop };
      return metaMiddleware()(promiseMiddleware(methods)(baseDispatch))(action);
    };
    foobar = { foo: 'bar' };
    err = new Error();
  });

  // it('dispatches first action before promise'), async () => {

  //   }
  // });

  it('dispatches first action before promise without arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: new Promise(() => {})
      }
    });

    expect(baseDispatch.calledOnce).to.be.true;

    expect(baseDispatch.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE'
    });
  });

  it('dispatches first action before promise with arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: new Promise(() => {}),
        foo: 'bar'
      }
    });

    expect(baseDispatch.calledOnce).to.be.true;

    expect(baseDispatch.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: {
        foo: 'bar'
      }
    });
  });

  it('dispatches resolve action with arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE_2',
      payload: {
        promise: Promise.resolve(foobar),
        foo2: 'bar2'
      }
    });

    expect(baseDispatch.calledTwice).to.be.true;

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: resolve('ACTION_TYPE_2'),
      payload: {
        promise: foobar,
        foo2: 'bar2'
      }
    });
  });

  // it('handles Flux standard actions', async () => {
  //   await dispatch({
  //     type: 'ACTION_TYPE',
  //     payload: Promise.resolve(foobar)
  //   });

  //   expect(baseDispatch.calledOnce).to.be.true;
  //   expect(baseDispatch.firstCall.args[0]).to.deep.equal({
  //     type: 'ACTION_TYPE',
  //     payload: foobar
  //   });

  //   await dispatch({
  //     type: 'ACTION_TYPE',
  //     payload: Promise.reject(err)
  //   }).catch(noop);

  //   expect(baseDispatch.calledTwice).to.be.true;
  //   expect(baseDispatch.secondCall.args[0]).to.deep.equal({
  //     type: 'ACTION_TYPE',
  //     payload: err,
  //     error: true
  //   });
  // });

  it('handles promises', async () => {
    await dispatch(Promise.resolve(foobar));
    expect(baseDispatch.calledOnce).to.be.true;
    expect(baseDispatch.firstCall.args[0]).to.equal(foobar);

    await expect(dispatch(Promise.reject(err))).to.eventually.be.rejectedWith(err);
  });

  it('returns the reject and resolve strings', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_RESOLVE');
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_REJECT');
  });

  it('ignores non-promises', async () => {
    dispatch(foobar);
    expect(baseDispatch.calledOnce).to.be.true;
    expect(baseDispatch.firstCall.args[0]).to.equal(foobar);

    dispatch({ type: 'ACTION_TYPE', payload: foobar });
    expect(baseDispatch.calledTwice).to.be.true;
    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: foobar
    });
  });

  it('starts async dispatches from beginning of middleware chain', async () => {
    await dispatch(Promise.resolve({ type: GIVE_ME_META }));
    dispatch({ type: GIVE_ME_META });
    expect(baseDispatch.args.map(args => args[0].meta)).to.eql([
      'here you go',
      'here you go'
    ]);
  });
});
