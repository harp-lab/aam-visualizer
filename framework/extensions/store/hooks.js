import { reqFunctionFactory, reqReduxAction } from 'extensions/checks';
import * as hooks from 'fext/store/hooks';

export const generateMetadataHook = reqReduxAction(hooks, 'generateMetadataHook');
export const nodeSelectHook = reqReduxAction(hooks, 'nodeSelectHook');
export const nodeUnselectHook = reqReduxAction(hooks, 'nodeUnselectHook');

export const cyNodeDataHook = reqFunctionFactory(hooks, 'cyNodeDataHook');
