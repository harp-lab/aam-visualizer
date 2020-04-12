import { reqFunction, reqFunctionFactory, reqReduxAction } from 'extensions/checks';
import * as hooks from 'fext/store/hooks';

const path = 'fext/store/hooks';

export const dataProcessHook = reqFunction(hooks, 'dataProcessHook', path);

export const generateMetadataHook = reqReduxAction(hooks, 'generateMetadataHook', path);
export const nodeSelectHook = reqReduxAction(hooks, 'nodeSelectHook', path);
export const nodeUnselectHook = reqReduxAction(hooks, 'nodeUnselectHook', path);

export const cyNodeDataHook = reqFunctionFactory(hooks, 'cyNodeDataHook', path);
