"""
CodeAtlas Progress Tracker
Streams analysis progress via Server-Sent Events
"""
import asyncio
import time
from typing import AsyncGenerator, Dict, Any, Optional, Callable
from pathlib import Path
import json


class ProgressTracker:
    """Track and stream analysis progress"""
    
    def __init__(self):
        self.steps: Dict[str, Dict[str, Any]] = {}
        self.current_step: Optional[str] = None
        self.total_steps = 0
        self.completed_steps = 0
    
    def register_steps(self, steps: list):
        """Register progress steps"""
        self.steps = {s["id"]: {"label": s["label"], "progress": 0, "status": "pending"} for s in steps}
        self.total_steps = len(steps)
        self.completed_steps = 0
    
    def start_step(self, step_id: str):
        """Mark a step as started"""
        if step_id in self.steps:
            self.current_step = step_id
            self.steps[step_id]["status"] = "running"
            self.steps[step_id]["progress"] = 0
    
    def update_step(self, step_id: str, progress: float, detail: str = ""):
        """Update progress of current step"""
        if step_id in self.steps:
            self.steps[step_id]["progress"] = min(100, max(0, progress))
            if detail:
                self.steps[step_id]["detail"] = detail
    
    def complete_step(self, step_id: str):
        """Mark a step as completed"""
        if step_id in self.steps:
            self.steps[step_id]["status"] = "completed"
            self.steps[step_id]["progress"] = 100
            self.completed_steps += 1
            if self.current_step == step_id:
                self.current_step = None
    
    def get_overall_progress(self) -> float:
        """Calculate overall progress percentage"""
        if self.total_steps == 0:
            return 0
        completed = self.completed_steps
        current_progress = 0
        if self.current_step and self.current_step in self.steps:
            current_progress = self.steps[self.current_step]["progress"] / 100
        return ((completed + current_progress) / self.total_steps) * 100
    
    def get_state(self) -> Dict[str, Any]:
        """Get current progress state"""
        return {
            "overall": round(self.get_overall_progress(), 1),
            "current_step": self.current_step,
            "completed_steps": self.completed_steps,
            "total_steps": self.total_steps,
            "steps": {
                sid: {
                    "label": s["label"],
                    "progress": round(s["progress"], 1),
                    "status": s["status"],
                    "detail": s.get("detail", ""),
                }
                for sid, s in self.steps.items()
            },
        }


async def progress_stream(tracker: ProgressTracker, task_func, *args, **kwargs) -> AsyncGenerator[str, None]:
    """
    Run a task and stream progress updates.
    Yields SSE formatted progress events.
    """
    import concurrent.futures
    
    # Send initial state
    yield f"data: {json.dumps(tracker.get_state())}\n\n"
    
    # Run the task in a thread pool and poll for progress
    loop = asyncio.get_event_loop()
    future = loop.run_in_executor(None, lambda: task_func(*args, **kwargs))
    
    while not future.done():
        state = tracker.get_state()
        yield f"data: {json.dumps(state)}\n\n"
        await asyncio.sleep(0.3)
    
    # Get result
    try:
        result = future.result()
        # Send final 100% state
        for step_id in tracker.steps:
            tracker.complete_step(step_id)
        final_state = tracker.get_state()
        final_state["overall"] = 100
        final_state["result"] = result
        yield f"data: {json.dumps(final_state)}\n\n"
    except Exception as e:
        error_state = tracker.get_state()
        error_state["error"] = str(e)
        yield f"data: {json.dumps(error_state)}\n\n"


def make_progress_generator(task_func, *args, **kwargs):
    """Create an async generator that runs a task and yields progress"""
    tracker = ProgressTracker()
    
    async def generator():
        # Send initial
        yield f"data: {json.dumps(tracker.get_state())}\n\n"
        
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(None, lambda: task_func(tracker, *args, **kwargs))
        
        while not future.done():
            state = tracker.get_state()
            yield f"data: {json.dumps(state)}\n\n"
            await asyncio.sleep(0.3)
        
        try:
            result = future.result()
            final_state = tracker.get_state()
            final_state["overall"] = 100
            final_state["done"] = True
            if result:
                final_state["result"] = result
            yield f"data: {json.dumps(final_state)}\n\n"
        except Exception as e:
            error_state = tracker.get_state()
            error_state["error"] = str(e)
            error_state["done"] = True
            yield f"data: {json.dumps(error_state)}\n\n"
    
    return generator, tracker
