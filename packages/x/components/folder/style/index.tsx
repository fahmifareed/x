import { mergeToken } from '@ant-design/cssinjs-utils';
import { genStyleHooks } from '../../theme/genStyleUtils';
import type { FullToken, GenerateStyle, GetDefaultToken } from '../../theme/interface';

export interface ComponentToken {
  /**
   * @desc
   * @descEN
   */
  colorBgDirectory: string;
}

export interface FolderToken extends FullToken<'Folder'> {}

const genFolderStyle: GenerateStyle<FolderToken> = (token) => {
  const { antCls, componentCls } = token;

  return {
    [componentCls]: {
      height: '100%',
      [`${antCls}-tree`]: {
        background: 'transparent',
        borderRadius: 'unset',
      },
      [`${componentCls}-tree-title`]: {
        display: 'flex',
        alignItems: 'center',
      },
      [`${componentCls}-tree-content`]: {
        paddingInline: token.padding,
        paddingBlock: token.paddingXS,
      },
      [`${componentCls}-container`]: {
        height: '100%',
      },
      [`${componentCls}-tree`]: {
        background: token.colorBgDirectory,
      },
      [`${componentCls}-content`]: {
        width: '100%',
      },
      [`&${componentCls}-rtl`]: {
        direction: 'rtl',
      },
    },
  };
};

const genFilePreviewStyle: GenerateStyle<FolderToken> = (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      [`${componentCls}-preview`]: {
        background: token.colorBgContainer,
      },
      [`${componentCls}-preview-title`]: {
        background: token.colorBgContainer,
        paddingInline: token.padding,
        paddingBlock: token.paddingXS,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      },
      [`${componentCls}-preview-code`]: {
        background: token.colorBgContainer,
        paddingInline: token.padding,
        paddingBlock: token.paddingXS,
      },
    },
  };
};

export const prepareComponentToken: GetDefaultToken<'Folder'> = (token) => {
  return {
    colorBgDirectory: token.colorFillTertiary,
  };
};

export default genStyleHooks<'Folder'>(
  'Folder',
  (token) => {
    const compToken = mergeToken<FolderToken>(token, {});

    return [genFolderStyle(compToken), genFilePreviewStyle(compToken)];
  },
  prepareComponentToken,
);
