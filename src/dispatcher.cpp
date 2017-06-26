#include "dispatcher.h"

void Dispatcher::operator()(const Task &task) {
    std::unique_lock<std::mutex> lock(m_mutex);
    m_function = task;

    while(m_function)
        m_condition_variable.wait(lock);
}

void Dispatcher::execTask() {
    std::unique_lock<std::mutex> lock(m_mutex);
    if(!m_function)
        return;

    m_function();
    m_function = nullptr;
    m_condition_variable.notify_all();
}
