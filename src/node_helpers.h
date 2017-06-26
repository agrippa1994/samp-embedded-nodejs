#pragma once
#include <node_api.h>

#define NATIVE_NAPI_MODULE(module, init) NAPI_MODULE_X(module, init, NULL, NM_F_BUILTIN)

class NodeScope {
public:
    explicit NodeScope(napi_env env);
    ~NodeScope();

    NodeScope(const NodeScope &) = delete;
    NodeScope operator=(const NodeScope &) = delete;

private:
    napi_env m_env;
    napi_handle_scope m_scope;
};
