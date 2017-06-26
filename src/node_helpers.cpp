#include "node_helpers.h"

NodeScope::NodeScope(napi_env env) : m_env(env) {
    napi_open_handle_scope(m_env, &m_scope);
}

NodeScope::~NodeScope() {
    napi_close_handle_scope(m_env, m_scope);
}
