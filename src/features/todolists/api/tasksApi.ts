import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"
import { TASK_COUNT } from "@/common/constants"

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      getTasks: build.query<GetTasksResponse, { id: string; params: { page: number } }>({
        query: ({ id, params }) => ({ url: `todo-lists/${id}/tasks`, params: { ...params, count: TASK_COUNT } }),
        providesTags: (_result, _error, { id }) => [{ type: "Task", id }],
        // keepUnusedDataFor:30, // время кеша точечно..
      }),
      addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
        query: ({ todolistId, title }) => ({
          url: `todo-lists/${todolistId}/tasks`,
          method: "POST",
          body: { title },
        }),
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
      }),
      removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
        query: ({ todolistId, taskId }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
      }),
      updateTask: build.mutation<
        BaseResponse<{ item: DomainTask }>,
        { todolistId: string; taskId: string; model: UpdateTaskModel }
      >({
        query: ({ todolistId, taskId, model }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "PUT",
          body: model,
        }),
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],

        onQueryStarted: async ({ taskId, model, todolistId }, { dispatch, getState, queryFulfilled }) => {
          const args = tasksApi.util.selectCachedArgsForQuery(getState(), "getTasks")
          let patchResults: any[] = []
          args.forEach((arg) => {
            patchResults.push(
              dispatch(
                tasksApi.util.updateQueryData(
                  "getTasks",
                  { id: todolistId, params: { page: arg.params.page } },
                  (res) => {
                    const index = res.items.findIndex((task) => task.id === taskId)
                    if (index !== -1) {
                      res.items[index] = { ...res.items[index], ...model }
                    }
                  },
                ),
              ),
            )
          })
          try {
            await queryFulfilled
          } catch (error) {
            patchResults.forEach((patchResult) => {
              patchResult.undo()
            })
          }
        },
      }),
    }
  },
})

export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation } = tasksApi

// export const _tasksApi = {
//   getTasks(todolistId: string) {
//     return instance.get<GetTasksResponse>(`/todo-lists/${todolistId}/tasks`)
//   },
//   createTask(payload: { todolistId: string; title: string }) {
//     const { todolistId, title } = payload
//     return instance.post<BaseResponse<{ item: DomainTask }>>(`/todo-lists/${todolistId}/tasks`, { title })
//   },
//   updateTask(payload: { todolistId: string; taskId: string; model: UpdateTaskModel }) {
//     const { todolistId, taskId, model } = payload
//     return instance.put<BaseResponse<{ item: DomainTask }>>(`/todo-lists/${todolistId}/tasks/${taskId}`, model)
//   },
//   deleteTask(payload: { todolistId: string; taskId: string }) {
//     const { todolistId, taskId } = payload
//     return instance.delete<BaseResponse>(`/todo-lists/${todolistId}/tasks/${taskId}`)
//   },
// }
//
//
// //40+