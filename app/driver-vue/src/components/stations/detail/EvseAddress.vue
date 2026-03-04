<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
SPDX-License-Identifier: Apache-2.0
-->

<template>
  <ui5-form
    class="margin-bottom"
    :header-text="$t('address.title')"
    layout="S1 M3 L6 XL6"
    label-span="S12 M12 L12 XL12"
  >
    <ui5-form-item>
      <ui5-label for="numberInp" slot="labelContent">{{ $t('address.number') }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.number || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="streetInp" slot="labelContent">{{ $t('address.street') }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.street || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="postalCodeInp" slot="labelContent">{{ $t('address.postal_code') }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.postalCode || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="cityInp" slot="labelContent">{{ $t('address.city') }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.city || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="countryCodeInp" slot="labelContent">{{
        $t('address.country_code')
      }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.countryCode || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="countryInp" slot="labelContent">{{ $t('address.country') }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.country || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="stateInp" slot="labelContent">{{ $t('address.state') }}</ui5-label>
      <ui5-text>{{ evse?.location?.address?.state || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="latitudeInp" slot="labelContent">{{ $t('address.latitude') }}</ui5-label>
      <ui5-text>{{ evse?.location?.coordinates?.latitude || '' }}</ui5-text>
    </ui5-form-item>
    <ui5-form-item>
      <ui5-label for="longitudeInp" slot="labelContent">{{ $t('address.longitude') }}</ui5-label>
      <ui5-text>{{ evse?.location?.coordinates?.longitude || '' }}</ui5-text>
    </ui5-form-item>
  </ui5-form>
</template>

<script lang="ts" setup>
import '@ui5/webcomponents/dist/Form.js';
import '@ui5/webcomponents/dist/FormGroup.js';
import '@ui5/webcomponents/dist/FormItem.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Text.js';
import type { Evse } from '@/store/evse';

defineProps<{ evse: Evse }>();
</script>

<style scoped>
.margin-bottom {
  margin-bottom: 10px;
}
</style>
