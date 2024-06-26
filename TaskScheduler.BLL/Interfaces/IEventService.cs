﻿using TaskScheduler.DAL.Entities;

namespace TaskScheduler.BLL.Interfaces
{
    public interface IEventService
    {
        Task Add(Event entity);
        Task Delete(int id);
        Task<List<Event>> Get();
        Task Update(Event entity);
    }
}