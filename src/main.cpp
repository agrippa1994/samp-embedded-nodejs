#include <sampgdk.h>
#include <node.h>
#include <node_api.h>
#include <thread>

#include "dispatcher.h"
#include "node_helpers.h"


#define UNUSED(x) (void)x;

Dispatcher dispatcher;

namespace nsamp
{
    napi_value invokeNative(napi_env env, napi_callback_info info) {
        NodeScope scope(env);
        UNUSED(scope)

        napi_value argv[32], thisPtr;
        size_t argc = sizeof(argv) / sizeof(argv[0]);
        napi_get_cb_info(env, info, &argc, argv, &thisPtr, nullptr);

        if(argc < 3) {
            napi_throw_error(env, "Invalid number of arguments");
            return 0;
        }

        // fetch native string
        char nativeString[128];
        if(napi_get_value_string_utf8(env, argv[0], nativeString, sizeof(nativeString), nullptr) != napi_ok) {
            napi_throw_error(env, "First argument must be a string");
            return 0;
        }

        // verify native name
        AMX_NATIVE native = sampgdk_FindNative(nativeString);
        if(native == nullptr) {
            napi_throw_error(env, "Native can not be found");
            return 0;
        }

        // fetch format
        char formatString[128];
        if(napi_get_value_string_utf8(env, argv[1], formatString, sizeof(formatString), nullptr) != napi_ok) {
            napi_throw_error(env, "Second argument must be a string");
            return 0;
        }

        // fetch number of arguments
        uint32_t numberOfArgs = 0;
        if(napi_get_value_uint32(env, argv[2], &numberOfArgs) != napi_ok) {
            napi_throw_error(env, "Third argument must be a number");
            return 0;
        }

        if(argc - 3 != numberOfArgs) {
            napi_throw_error(env, "Number of native arguments must match the number of arguments");
            return 0;
        }

        // create arguments for pawn
        void **pawnArgArray = (void **)1; // hack, sampgdk does not allow nullptr as pawn arguments array
        if(numberOfArgs > 0) {
            pawnArgArray = new void *[numberOfArgs];
            for(int nodeIdx = 3, pawnIdx = 0; nodeIdx < argc; ++nodeIdx, ++pawnIdx) {
                napi_get_buffer_info(env, argv[nodeIdx], &pawnArgArray[pawnIdx], nullptr);
            }
        }

        int gdkReturnValue = 0;
        dispatcher([&gdkReturnValue, native, formatString, pawnArgArray]() {
            gdkReturnValue = sampgdk_InvokeNativeArray(native, formatString, pawnArgArray);
        });

        // clean up
        if(numberOfArgs > 0) {
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
        const char *x[] = { "samp03svr", "../playground/main.js" };
        node::Start(2, const_cast<char **>(x));
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
