import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value, Variants } = sdk

const keys = InputSpec.of({
  siteKey: Value.text({
    name: i18n('Site key'),
    description: null,
    required: true,
    default: null,
  }),
  secretKey: Value.text({
    name: i18n('Secret key'),
    description: null,
    required: true,
    default: null,
    masked: true,
  }),
})

export const inputSpec = InputSpec.of({
  captcha: Value.union({
    name: i18n('Captcha provider'),
    description: i18n(
      "Protects Keila's signup forms and password-reset page from bots. Without your own keys Keila uses hCaptcha's public test keys, which load hCaptcha but stop no bots.",
    ),
    default: 'none',
    variants: Variants.of({
      none: { name: i18n('None (hCaptcha test keys)'), spec: InputSpec.of({}) },
      hcaptcha: { name: 'hCaptcha', spec: keys },
      friendly_captcha: { name: 'Friendly Captcha', spec: keys },
    }),
  }),
})

export const captcha = sdk.Action.withInput(
  'captcha',

  async () => ({
    name: i18n('Configure Captcha'),
    description: i18n(
      'Enter hCaptcha or Friendly Captcha keys so signup forms and password resets are protected from bots. Keila restarts to apply the change.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Settings'),
    visibility: 'enabled',
  }),

  inputSpec,

  async () => {
    const c = await storeJson.read((s) => s.captcha).once()
    if (!c || c.provider === 'none')
      return { captcha: { selection: 'none' as const, value: {} } }
    return {
      captcha: {
        selection: c.provider,
        value: { siteKey: c.siteKey ?? '', secretKey: c.secretKey ?? '' },
      },
    }
  },

  async ({ effects, input }) => {
    const { selection, value } = input.captcha
    await storeJson.merge(effects, {
      captcha:
        selection === 'none'
          ? { provider: 'none', siteKey: null, secretKey: null }
          : {
              provider: selection,
              siteKey: value.siteKey,
              secretKey: value.secretKey,
            },
    })
  },
)
