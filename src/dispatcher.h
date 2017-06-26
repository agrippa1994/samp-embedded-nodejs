#pragma once
#include <functional>
#include <condition_variable>
#include <thread>

class Dispatcher {
public:
    using Task = std::function<void()>;

    explicit Dispatcher() = default;
    ~Dispatcher() = default;

    void operator()(const Task &task);
    void execTask();

private:
    Task m_function;
    std::mutex m_mutex;
    std::condition_variable m_condition_variable;
};
