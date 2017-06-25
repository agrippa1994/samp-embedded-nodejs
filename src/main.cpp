#include <sampgdk.h>

#include <node.h>
#include <node_api.h>
#include <thread>
#include <iostream>
#include <queue>
#include <functional>
#include <future>
#include <condition_variable>

#include "string.h"

#define UNUSED(x) (void)x;
#define NATIVE_NAPI_MODULE(module, init) NAPI_MODULE_X(module, init, NULL, NM_F_BUILTIN)

class Dispatcher {
public:
    explicit Dispatcher() = default;
    ~Dispatcher() = default;

    void operator()(std::function<void(void)> task) {
        std::unique_lock<std::mutex> lock(m_mutex);
        m_function = task;

        while(m_function)
            m_condition_variable.wait(lock);
    }

    void execTask() {
        std::unique_lock<std::mutex> lock(m_mutex);
        if(!m_function)
            return;
        
        m_function();
        m_function = nullptr;
        m_condition_variable.notify_all();
    }

private:
    std::mutex m_mutex;
    std::function<void()> m_function;
    std::condition_variable m_condition_variable;
};

Dispatcher dispatcher;

namespace nsamp
{
    class NodeScope {
    public:
        explicit NodeScope(napi_env env) : m_env(env) {
            napi_open_handle_scope(m_env, &m_scope);
        }
        ~NodeScope() {
            napi_close_handle_scope(m_env, m_scope);
        }

        NodeScope(const NodeScope &) = delete;
        NodeScope operator=(const NodeScope &) = delete;

    private:
        napi_env m_env;
        napi_handle_scope m_scope;
    };

    napi_value invokeNative(napi_env env, napi_callback_info info) {
        NodeScope scope(env);
        UNUSED(scope)

        napi_value argv[10], thisPtr;
        size_t argc = sizeof(argv) / sizeof(argv[0]);
        napi_get_cb_info(env, info, &argc, argv, &thisPtr, nullptr);

        if(argc < 1) {
            napi_throw_error(env, "Invalid number of arguments");
            return 0;
        }

        napi_valuetype valueType;

        // fetch native string
        napi_typeof(env, argv[0], &valueType);
        if(valueType != napi_string) {
            napi_throw_error(env, "First argument must be a string");
            return 0;
        }

        char nativeString[128];
        napi_get_value_string_utf8(env, argv[0], nativeString, sizeof(nativeString), nullptr);
        AMX_NATIVE native = sampgdk_FindNative(nativeString);
        if(native == nullptr) {
            napi_throw_error(env, "Native can not be found");
            return 0;
        }

        // fetch format
        char formatString[128];
        if(argc >= 2) {
            napi_typeof(env, argv[1], &valueType);
            if(valueType != napi_string) {
                napi_throw_error(env, "Second argument must be a string");
                return 0;
            }
            napi_get_value_string_utf8(env, argv[1], formatString, sizeof(formatString), nullptr);
        }

        // check if format string has elements and nodejs has arguments on the stack
        if(strlen(formatString) > 0 && (argc - 2 <= 0)) {
            napi_throw_error(env, "Format string has elements but no arguments");
            return 0;
        }

        // create arguments for pawn
        void **pawnArgArray = (void **)1; // hack, sampgdk does not allow nullptr as pawn arguments array
        if(argc > 2) {
            pawnArgArray = new void *[argc - 2];
            for(int nodeIdx = 2, pawnIdx = 0; nodeIdx < argc; ++nodeIdx, ++pawnIdx) {
                napi_get_buffer_info(env, argv[nodeIdx], &pawnArgArray[pawnIdx], nullptr);
            }
        }

        int gdkReturnValue = 0;
        dispatcher([&gdkReturnValue, native, formatString, pawnArgArray]() {
            gdkReturnValue = sampgdk_InvokeNativeArray(native, formatString, pawnArgArray);
        });

        // clean up
        if(argc > 2) {
            delete pawnArgArray;
        }
    
        napi_value returnValue;
        napi_create_number(env, static_cast<double>(gdkReturnValue), &returnValue);
        return returnValue;
    }

    void init(napi_env env, napi_value exports, napi_value module, void *privileges) {
        napi_property_descriptor desc[] = {
            { "invokeNative", 0, invokeNative, 0, 0, 0, napi_default, 0 }
        };
        napi_status status = napi_define_properties(env, exports, sizeof(desc) / sizeof(*desc), desc);
    }
}

NATIVE_NAPI_MODULE(samp, nsamp::init)

PLUGIN_EXPORT bool PLUGIN_CALL OnPublicCall(AMX *amx, const char *name, cell *params, cell *retval) {
    sampgdk::logprintf("Public Call %s", name);
    return true;
}

PLUGIN_EXPORT unsigned int PLUGIN_CALL Supports() {
  return sampgdk::Supports() | SUPPORTS_PROCESS_TICK;
}

PLUGIN_EXPORT bool PLUGIN_CALL Load(void **ppData) {
    std::thread thr([]() {
        char *x[] = { "/home/mani/node_embedding/samp_test_plugin/samp03/samp03svr", "main.js" };
        node::Start(2, (char**)x);
    });
    thr.detach();
    return sampgdk::Load(ppData);
}

PLUGIN_EXPORT void PLUGIN_CALL Unload() {
  sampgdk::Unload();
}

PLUGIN_EXPORT void PLUGIN_CALL ProcessTick() {
    dispatcher.execTask();
    sampgdk::ProcessTick();
}
