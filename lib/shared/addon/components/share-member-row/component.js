import Errors from 'ui/utils/errors';
import Component from '@ember/component';
import layout from './template';
import { set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Identicon from 'identicon.js';

const BASIC_ROLES = [
  {
    label:      'Owner',
    value:      'owner',
  },
  {
    label:      'Member',
    value:      'member',
  },
  {
    label: 'Read Only',
    value: 'read-only',
  }
];

export default Component.extend({
  globalStore:          service(),
  layout,

  choices:              BASIC_ROLES,
  tagName:              '',
  member:               null,
  editing:              true,
  isPublic:             false,
  clusterResource:      null,
  users:                null,
  principal:            null,
  principalId:          null,
  principalGravatarSrc: null,

  init() {
    this._super(...arguments);

    const { isPublic, member } = this;

    if (!isPublic && member.userPrincipalId) {
      this.globalStore.rawRequest({
        url:    `principals/${ encodeURIComponent(member.userPrincipalId) }`,
        method: 'GET',
      }).then((xhr) => {
        if ( xhr.status === 204 ) {
          return;
        }

        if ( xhr.body && typeof xhr.body === 'object') {
          set(this, 'principal', set(this, 'external', xhr.body));
          this.principalChanged();
        }

        return xhr;
      }).catch((xhr) => {
        if (member.userPrincipalId) {
          set(this, 'principalId', member.userPrincipalId);
          set(this, 'principalGravatarSrc', `data:image/png;base64,${ new Identicon(AWS.util.crypto.md5(member.userPrincipalId || 'Unknown', 'hex'), 80, 0.01).toString() }`)
        }

        return xhr;
      });
    }
  },

  actions: {
    gotError(err) {
      set(this, 'errors', [Errors.stringify(err)]);
    },
    addAuthorized(principal) {
      if (principal) {
        let { principalType, id } = principal;

        if (principalType === 'user') {
          set(this, 'member.userPrincipalId', id);
        } else if (principalType === 'group') {
          set(this, 'member.groupPrincipalId', id);
        }
      }
    },
    remove() {
      this.remove(this.member);
    },
  },

  noUpdate: computed('principal', 'principalId', function() {
    if (this.editing) {
      if (this.principal || this.principalId) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }),

  remove() {
    throw new Error('remove is a required action!')
  },

});